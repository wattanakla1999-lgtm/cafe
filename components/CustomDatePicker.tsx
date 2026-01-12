import React, { forwardRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { th } from 'date-fns/locale';
import { Button } from './Button';

// Register Thai locale
registerLocale('th', th);

interface CustomDatePickerProps {
    selected: Date;
    onChange: (date: Date | null) => void;
    placeholderText?: string;
    className?: string;
    selectsStart?: boolean;
    selectsEnd?: boolean;
    startDate?: Date;
    endDate?: Date;
    minDate?: Date;
    maxDate?: Date;
}

// Custom Input Component
const CustomInput = forwardRef<HTMLButtonElement, any>(({ value, onClick, className }, ref) => (
    <button
        className={`flex items-center gap-2 px-3 py-2 bg-white border border-[var(--color-coffee-200)] rounded-lg text-sm text-[var(--color-coffee-800)] hover:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 transition-all shadow-sm ${className}`}
        onClick={onClick}
        ref={ref}
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--color-coffee-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="font-medium">{value || "เลือกวันที่"}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-auto text-[var(--color-coffee-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    </button>
));

CustomInput.displayName = "CustomInput";

export function CustomDatePicker({
    selected,
    onChange,
    placeholderText,
    className,
    selectsStart,
    selectsEnd,
    startDate,
    endDate,
    minDate,
    maxDate
}: CustomDatePickerProps) {
    return (
        <div className="relative">
            <style>{`
                .react-datepicker-wrapper {
                    width: auto;
                    display: block;
                }
                .react-datepicker {
                    font-family: inherit;
                    border-radius: 1rem;
                    border: 1px solid var(--color-coffee-200);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                    font-size: 0.9rem;
                    background-color: white;
                }
                .react-datepicker__header {
                    background-color: var(--color-coffee-50);
                    border-bottom: 1px solid var(--color-coffee-100);
                    padding-top: 1rem;
                }
                .react-datepicker__current-month {
                    color: var(--color-coffee-900);
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                }
                .react-datepicker__day-name {
                    color: var(--color-coffee-500);
                    font-weight: 600;
                    margin: 0.2rem;
                }
                .react-datepicker__day {
                    color: var(--color-coffee-700);
                    margin: 0.2rem;
                    border-radius: 0.5rem;
                    font-weight: 500;
                }
                .react-datepicker__day:hover {
                    background-color: var(--color-coffee-100);
                    color: var(--color-coffee-900);
                }
                .react-datepicker__day--selected, 
                .react-datepicker__day--keyboard-selected {
                    background-color: var(--color-primary) !important;
                    color: white !important;
                    font-weight: bold;
                }
                .react-datepicker__day--in-range {
                    background-color: var(--color-coffee-100);
                    color: var(--color-coffee-900);
                }
                .react-datepicker__day--in-selecting-range {
                    background-color: var(--color-coffee-200);
                }
                .react-datepicker__today-button {
                    background-color: var(--color-coffee-50);
                    border-top: 1px solid var(--color-coffee-100);
                    color: var(--color-primary);
                    font-weight: bold;
                    padding: 0.5rem 0;
                }
                .react-datepicker__navigation-icon::before {
                    border-color: var(--color-coffee-400);
                }
                .react-datepicker__triangle {
                    display: none;
                }
                .react-datepicker-popper {
                    z-index: 9999 !important;
                }
            `}</style>
            <DatePicker
                selected={selected}
                onChange={onChange}
                customInput={<CustomInput className={className} />}
                locale="th"
                dateFormat="dd MMM yyyy"
                placeholderText={placeholderText}
                selectsStart={selectsStart}
                selectsEnd={selectsEnd}
                startDate={startDate}
                endDate={endDate}
                minDate={minDate}
                maxDate={maxDate}
                showPopperArrow={false}
                popperProps={{
                    strategy: "fixed"
                }}
            />
        </div>
    );
}
