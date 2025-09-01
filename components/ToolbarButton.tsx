import React from 'react';

interface ToolbarButtonProps {
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    title: string;
    children: React.ReactNode;
    color: string;
    disabled?: boolean;
}

const colorClasses: Record<string, string> = {
    purple: 'bg-purple-500/80',
    blue: 'bg-blue-500/80',
    red: 'bg-red-500/80',
    gray: 'bg-gray-500/80',
    yellow: 'bg-yellow-500/80',
    cyan: 'bg-cyan-500/80',
    lime: 'bg-lime-500/80',
    green: 'bg-green-500/80',
    pink: 'bg-pink-500/80',
    orange: 'bg-orange-500/80',
    indigo: 'bg-indigo-500/80',
};

const ToolbarButton = ({ onClick, title, children, color, disabled }: ToolbarButtonProps) => {
    const bgColor = colorClasses[color] || colorClasses.gray;

    return (
        <button
            onClick={onClick}
            title={title}
            disabled={disabled}
            className="group relative flex items-center justify-center p-0.5 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
            <div className={`absolute inset-0 rounded-full ${bgColor} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}></div>
            <div className="relative z-10 text-white">
                {children}
            </div>
        </button>
    );
};

export default ToolbarButton;
