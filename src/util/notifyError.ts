import Feedback from "owp.feedback";

export function notifyError(error: unknown): void {
    Feedback.error(getErrorMessage(error), { sticky: true });
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
