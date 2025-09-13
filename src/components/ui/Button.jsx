import local from "./Buttons.module.css";

export default function Button({children, onClick, disabled = false, ...props}) {
  return <button type="button" className={local.button} onClick={onClick} disabled={disabled} {...props}>
    {children}
  </button>
}
