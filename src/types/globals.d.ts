declare module 'detectos.js' {
    export default class DetectOS {
        constructor(environment?: unknown);
        browser: string | null;
        version: number | string | null;
        OS: string | null;
        os: string | null;
    }
}

declare module 'html-to-pdfmake';

// File System Access API (noch nicht in lib.dom enthalten)
interface FilePickerAcceptType {
    description?: string;
    accept: Record<string, string[]>;
}

interface SaveFilePickerOptions {
    suggestedName?: string;
    startIn?: FileSystemHandle | string;
    types?: FilePickerAcceptType[];
}

interface OpenFilePickerOptions {
    multiple?: boolean;
    types?: FilePickerAcceptType[];
}

interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>;
}

// Funktionen, die im HTML (onclick, href="javascript:…") aufgerufen werden
interface Window {
    eingabe1: () => void;
    ergebnisse: () => void;
    hilfe: () => void;
    display_einstellungen: () => void;
    duenn3D: () => void;
    duennQuer: () => void;
    mypdf: () => void;
    berechnungErforderlich: (wert?: boolean) => void;
}
