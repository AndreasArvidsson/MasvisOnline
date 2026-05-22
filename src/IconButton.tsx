import type { JSX } from "react";
import { classNames } from "./util/classNames";

interface Props {
    title?: string;
    className?: string;
    onClick?: () => void;
    children: React.ReactNode;
}

export function IconButton({
    children,
    title,
    className,
    onClick,
}: Props): JSX.Element {
    return (
        <button
            type="button"
            className={classNames(
                "bg-transparent border-0 p-0 hover-underline",
                className,
            )}
            title={title}
            onClick={onClick}
        >
            {children}
        </button>
    );
}
