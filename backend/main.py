import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

import jwt
from fastapi import FastAPI, Depends, HTTPException, status, Cookie, Response, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter
from passlib.hash import bcrypt
from pydantic import BaseModel, EmailStr, constr

# ----------------------------------------------------------------------------
# Configuration & helpers
# ----------------------------------------------------------------------------

SECRET_KEY = "CHANGE_ME_SECRET"  # For demo purposes only (in-memory backend).
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7
ALGORITHM = "HS256"


def create_token(data: Dict[str, Any], expires_delta: timedelta) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return bcrypt.hash(password)


# ----------------------------------------------------------------------------
# In-memory storage
# ----------------------------------------------------------------------------

class MemoryStorage:
    def __init__(self):
        self.users: Dict[str, Dict[str, Any]] = {}
        self.tasks: Dict[str, Dict[str, Any]] = {}

    # User helpers -----------------------------------------------------------
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return next((u for u in self.users.values() if u["email"].lower() == email.lower()), None)

    def add_user(self, user_dict: Dict[str, Any]):
        self.users[user_dict["id"]] = user_dict

    def add_task(self, task_dict: Dict[str, Any]):
        self.tasks[task_dict["id"]] = task_dict


storage = MemoryStorage()

# ----------------------------------------------------------------------------
# Pydantic Schemas
# ----------------------------------------------------------------------------

NameStr = constr(min_length=1, max_length=100)
TitleStr = constr(min_length=1, max_length=150)


class UserBase(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        orm_mode = True


class UserCreate(BaseModel):
    name: NameStr
    email: EmailStr
    password: constr(min_length=6, max_length=128)


class UserUpdate(BaseModel):
    name: Optional[NameStr] = None
    role: Optional[str] = None  # admin-only


class TokenResponse(BaseModel):
    accessToken: str


class AuthResponse(BaseModel):
    user: UserBase
    accessToken: str

# Task schemas --------------------------------------------------------------


class TaskBase(BaseModel):
    id: str
    title: str
    description: str
    status: str
    priority: str
    assignee_id: Optional[str] = None
    creator_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class TaskCreate(BaseModel):
    title: TitleStr
    description: str = ""
    priority: str = "medium"
    assignee_id: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[TitleStr] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None


class PagedResponse(BaseModel):
    items: List[TaskBase]
    total: int
    page: int
    limit: int


# ----------------------------------------------------------------------------
# Dependencies & security helpers
# ----------------------------------------------------------------------------


def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id: str = payload.get("sub")
    if user_id is None or user_id not in storage.users:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return storage.users[user_id]


def admin_required(user: Dict[str, Any] = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return user


# ----------------------------------------------------------------------------
# Routers
# ----------------------------------------------------------------------------

api_router = APIRouter(prefix="/api")

# Auth -----------------------------------------------------------------------

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, response: Response):
    if storage.get_user_by_email(data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    now = datetime.utcnow()
    user_dict = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password_hash": get_password_hash(data.password),
        "role": "user",
        "created_at": now,
    }
    storage.add_user(user_dict)

    access_token = create_token({"sub": user_id}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = create_token({"sub": user_id, "type": "refresh"}, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        samesite="lax",
        secure=False,
        path="/api/auth",
    )
    return {"user": UserBase(**user_dict), "accessToken": access_token}


@auth_router.post("/login", response_model=AuthResponse)
def login(data: UserCreate, response: Response):  # reuse schema for simplicity
    user = storage.get_user_by_email(data.email)
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    access_token = create_token({"sub": user["id"]}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = create_token({"sub": user["id"], "type": "refresh"}, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        samesite="lax",
        secure=False,
        path="/api/auth",
    )
    return {"user": UserBase(**user), "accessToken": access_token}


@auth_router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    response.delete_cookie(key="refresh_token", path="/api/auth")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@auth_router.post("/refresh", response_model=TokenResponse)
def refresh_token(response: Response, refresh_token: Optional[str] = Cookie(None)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id: str = payload.get("sub")
    if user_id not in storage.users:
        raise HTTPException(status_code=401, detail="User not found")

    # Issue new access token (refresh token remains the same for simplicity)
    new_access = create_token({"sub": user_id}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"accessToken": new_access}


@auth_router.get("/me", response_model=UserBase)
def me(user: Dict[str, Any] = Depends(get_current_user)):
    return UserBase(**user)


# Users ----------------------------------------------------------------------

users_router = APIRouter(prefix="/users", tags=["users"])


@users_router.get("/", response_model=List[UserBase])
def list_users(_: Dict[str, Any] = Depends(admin_required)):
    return [UserBase(**u) for u in storage.users.values()]


@users_router.get("/{user_id}", response_model=UserBase)
def get_user(user_id: str, current: Dict[str, Any] = Depends(get_current_user)):
    if user_id != current["id"] and current["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    user = storage.users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserBase(**user)


@users_router.patch("/{user_id}", response_model=UserBase)
def patch_user(user_id: str, data: UserUpdate, _: Dict[str, Any] = Depends(admin_required)):
    user = storage.users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.name is not None:
        user["name"] = data.name
    if data.role is not None:
        if data.role not in ("admin", "user"):
            raise HTTPException(status_code=400, detail="Invalid role")
        user["role"] = data.role
    return UserBase(**user)


@users_router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, _: Dict[str, Any] = Depends(admin_required)):
    if user_id not in storage.users:
        raise HTTPException(status_code=404, detail="User not found")
    storage.users.pop(user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# Tasks ----------------------------------------------------------------------

tasks_router = APIRouter(prefix="/tasks", tags=["tasks"])


@tasks_router.post("/", response_model=TaskBase, status_code=status.HTTP_201_CREATED)
def create_task(data: TaskCreate, user: Dict[str, Any] = Depends(get_current_user)):
    if data.assignee_id and data.assignee_id not in storage.users:
        raise HTTPException(status_code=400, detail="Assignee not found")
    task_id = str(uuid.uuid4())
    now = datetime.utcnow()
    task_dict = {
        "id": task_id,
        "title": data.title,
        "description": data.description,
        "status": "todo",
        "priority": data.priority,
        "assignee_id": data.assignee_id,
        "creator_id": user["id"],
        "created_at": now,
        "updated_at": now,
    }
    storage.add_task(task_dict)
    return TaskBase(**task_dict)


@tasks_router.get("/", response_model=PagedResponse)
def list_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    assignee_filter: Optional[str] = Query(None, alias="assignee"),
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    user: Dict[str, Any] = Depends(get_current_user),
):
    tasks = list(storage.tasks.values())

    # Permissions: users see their own created tasks + tasks assigned to them.
    if user["role"] != "admin":
        tasks = [t for t in tasks if t["creator_id"] == user["id"] or t.get("assignee_id") == user["id"]]

    # Filters
    if status_filter:
        tasks = [t for t in tasks if t["status"] == status_filter]
    if priority_filter:
        tasks = [t for t in tasks if t["priority"] == priority_filter]
    if assignee_filter:
        tasks = [t for t in tasks if t.get("assignee_id") == assignee_filter]
    if search:
        tasks = [t for t in tasks if search.lower() in t["title"].lower()]

    total = len(tasks)
    start = (page - 1) * limit
    end = start + limit
    items = [TaskBase(**t) for t in tasks[start:end]]
    return PagedResponse(items=items, total=total, page=page, limit=limit)


@tasks_router.get("/{task_id}", response_model=TaskBase)
def get_task(task_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    task = storage.tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if user["role"] != "admin" and task["creator_id"] != user["id"] and task.get("assignee_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return TaskBase(**task)


@tasks_router.put("/{task_id}", response_model=TaskBase)
def update_task(task_id: str, data: TaskUpdate, user: Dict[str, Any] = Depends(get_current_user)):
    task = storage.tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if user["role"] != "admin" and task["creator_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    if data.title is not None:
        task["title"] = data.title
    if data.description is not None:
        task["description"] = data.description
    if data.status is not None:
        task["status"] = data.status
    if data.priority is not None:
        task["priority"] = data.priority
    if data.assignee_id is not None:
        if data.assignee_id not in storage.users:
            raise HTTPException(status_code=400, detail="Assignee not found")
        task["assignee_id"] = data.assignee_id
    task["updated_at"] = datetime.utcnow()
    return TaskBase(**task)


@tasks_router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    task = storage.tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if user["role"] != "admin" and task["creator_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    storage.tasks.pop(task_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ----------------------------------------------------------------------------
# FastAPI application setup
# ----------------------------------------------------------------------------

app = FastAPI(title="Team Tasks API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(tasks_router)

app.include_router(api_router)


@app.get("/", include_in_schema=False)
def root():
    return {"message": "Team Tasks API"}
