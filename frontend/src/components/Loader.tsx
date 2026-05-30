export default function Loader({ small }: { small?: boolean }) {
  return <div className={small ? "loader small" : "loader"} />;
}
