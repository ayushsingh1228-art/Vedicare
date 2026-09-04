import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

export function Calendar({ className, ...props }) {
  return <DayPicker className={className} {...props} />;
}
