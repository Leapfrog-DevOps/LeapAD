export const renderStatusComponent = (obj) =>
  obj.userAccountControl !== 514 ? (
    <span className="green">
      <b>Active</b>
    </span>
  ) : (
    <span className="red">Disabled</span>
  );

export const getStatus = (obj) =>{
  console.log(obj)
 return obj.userAccountControl !==514 ? true : false;}

export const formatDate = (d) => (d ? new Date(d).toDateString() : "-");

export function isEmail(val) {
  const regEmail =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return !!regEmail.test(val);
}

export const LOGS = "LOGS_GENERATED";

export const emitLog = (text, color = "grey") => {
  const event = new CustomEvent(LOGS, {
    detail: {
      text,
      color,
    },
  });
  document.dispatchEvent(event);
};
