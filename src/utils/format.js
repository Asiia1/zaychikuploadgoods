export function nowStamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
}

export function human(bytes) {
    if (!Number.isFinite(bytes)) return '-';

    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let n = bytes;

    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i++;
    }

    return `${n.toFixed(1)} ${units[i]}`;
}