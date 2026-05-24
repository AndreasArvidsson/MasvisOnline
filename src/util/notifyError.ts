import Feedback from "owp.feedback";
import { getErrorMessage } from "./getErrorMessage";

export function notifyError(error: unknown): void {
    const message = typeof error === "string" ? error : getErrorMessage(error);
    Feedback.error(message, { sticky: true });
}
