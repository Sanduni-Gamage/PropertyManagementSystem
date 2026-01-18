import React from 'react';

interface InputFieldProps {
    label: string;
    name: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function InputField({
    label,
    name,
    type = 'text',
    value,
    onChange,
}: InputFieldProps) {
    return (
        <div className="mb-4">
            <label htmlFor={name} className="block mb-1 font-medium text-gray-700">
                {label}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            />
        </div>
    );
}
