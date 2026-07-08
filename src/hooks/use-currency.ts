"use client";

import { useState, useEffect } from "react";
import { getCurrencyCode, getCurrencyConfig, formatCurrency, setCurrencyCode, CurrencyConfig } from "@/lib/currency";

export function useCurrency() {
    // We initialize state with client-side value if available, or default
    const [currencyCode, setCurrencyCodeState] = useState("USD");

    useEffect(() => {
        // Update state to correct value once mounted (client-side only)
        setCurrencyCodeState(getCurrencyCode());

        const handleCurrencyChange = () => {
            setCurrencyCodeState(getCurrencyCode());
        };

        window.addEventListener("currencyChange", handleCurrencyChange);
        return () => {
            window.removeEventListener("currencyChange", handleCurrencyChange);
        };
    }, []);

    const config = getCurrencyConfig();

    return {
        currencyCode,
        config,
        formatCurrency: (value: any) => formatCurrency(value),
        setCurrency: (code: string) => setCurrencyCode(code),
    };
}
