"use client";

export interface CurrencyConfig {
    code: string;
    symbol: string;
    name: string;
    locale: string;
    digits: number;
}

export const CURRENCIES: CurrencyConfig[] = [
    { code: "USD", symbol: "$", name: "United States Dollar (USD)", locale: "en-US", digits: 2 },
    { code: "EUR", symbol: "€", name: "Euro (EUR)", locale: "de-DE", digits: 2 },
    { code: "UGX", symbol: "USh", name: "Ugandan Shilling (UGX)", locale: "en-UG", digits: 0 },
    { code: "KES", symbol: "KSh", name: "Kenyan Shilling (KES)", locale: "en-KE", digits: 0 },
    { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling (TZS)", locale: "en-TZ", digits: 0 },
    { code: "RWF", symbol: "RF", name: "Rwandan Franc (RWF)", locale: "rw-RW", digits: 0 },
    { code: "BIF", symbol: "FBu", name: "Burundian Franc (BIF)", locale: "fr-BI", digits: 0 },
    { code: "SSP", symbol: "SSP", name: "South Sudanese Pound (SSP)", locale: "en-SS", digits: 2 },
    { code: "CDF", symbol: "FC", name: "Congolese Franc (CDF)", locale: "fr-CD", digits: 2 },
    { code: "SOS", symbol: "Sh.So.", name: "Somali Shilling (SOS)", locale: "so-SO", digits: 0 },
];

export const getCurrencyCode = (): string => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("currency_preference") || "UGX";
    }
    return "UGX";
};

export const setCurrencyCode = (code: string) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("currency_preference", code);
        // Trigger a custom event to notify all components to re-render
        window.dispatchEvent(new Event("currencyChange"));
    }
};

export const getCurrencyConfig = (): CurrencyConfig => {
    const code = getCurrencyCode();
    return CURRENCIES.find(c => c.code === code) || CURRENCIES.find(c => c.code === "UGX") || CURRENCIES[0];
};

export const formatCurrency = (value: any): string => {
    if (value === undefined || value === null) {
        const config = getCurrencyConfig();
        const zeroValue = 0;
        const formattedZero = zeroValue.toLocaleString(config.locale, {
            minimumFractionDigits: config.digits,
            maximumFractionDigits: config.digits,
        });
        return ["UGX", "KES", "TZS", "RWF", "BIF", "CDF", "SOS"].includes(config.code)
            ? `${config.symbol} ${formattedZero}`
            : `${config.symbol}${formattedZero}`;
    }
    
    const num = Number(value);
    if (isNaN(num)) return "";
    
    const config = getCurrencyConfig();
    const formattedNum = num.toLocaleString(config.locale, {
        minimumFractionDigits: config.digits,
        maximumFractionDigits: config.digits,
    });
    
    if (["UGX", "KES", "TZS", "RWF", "BIF", "CDF", "SOS"].includes(config.code)) {
        return `${config.symbol} ${formattedNum}`;
    }
    return `${config.symbol}${formattedNum}`;
};
