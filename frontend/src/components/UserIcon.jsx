const colorArr = ["#008000ab", "#dd3d3dfc", "#0000ff8c"];
const bg = "#00a2ff";

export default function ({
  size = 0.6,
  group = false,
  scale = 1,
  dim = false,
  inactive = false,
  withoutMargin = false,
}) {
  const num = !!group ? 3 : 1;
  const dimension = size * 30;
  const defaultBg = inactive ? "grey" : bg;
  return (
    <div
      className="flex-center flex-row relative"
      style={{
        margin: withoutMargin ? 0 : "5px",
        marginRight: withoutMargin ? 0 : "10px",
        width: group ? "60px" : "50px",
        transform: `scale(${scale})`,
        opacity: dim ? 0.7 : 1,
      }}
    >
      {Array.from({ length: num }).map((item, idx) => (
        <div
          key={idx}
          className={`flex-column flex-center user-icon ${
            num > 1 ? "icon-group" : ""
          }`}
          style={{ position: !group ? "relative" : "absolute" }}
        >
          <div
            style={{
              height: `${dimension}px`,
              width: `${dimension}px`,
              borderRadius: "50%",
              margin: "2px",
              background: group ? colorArr[idx] : defaultBg,
            }}
          />
          <div
            style={{
              height: `${dimension}px`,
              width: `${dimension * 2}px`,
              borderRadius: "50% 50% 0 0",
              background: group ? colorArr[idx] : defaultBg,
            }}
          />
        </div>
      ))}
    </div>
  );
}
