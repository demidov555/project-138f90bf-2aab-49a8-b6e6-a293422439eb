Team Tasks – Backend (FastAPI)
================================

Requirements
------------
* Python 3.11+
* Dependencies from `requirements.txt`

Installation
------------
```bash
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Running
-------
```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```
The API will be available at `http://localhost:8000/api`.

Authentication
--------------
After logging-in/registering you get a JSON response containing `accessToken` and the browser receives an HttpOnly `refresh_token` cookie. Send the access token with every request in the header:
```
Authorization: Bearer <accessToken>
```
When the token expires call `POST /api/auth/refresh` (cookies must be included).
