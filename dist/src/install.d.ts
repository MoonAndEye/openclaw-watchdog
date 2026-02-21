export interface InstallOptions {
    intervalMinutes?: number;
}
export declare function installWatchdog(options?: InstallOptions): Promise<void>;
