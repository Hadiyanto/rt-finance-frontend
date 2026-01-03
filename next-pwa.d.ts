declare module "@ducanh2912/next-pwa" {
    import { NextConfig } from "next";

    interface PWAConfig {
        dest?: string;
        register?: boolean;
        skipWaiting?: boolean;
        disable?: boolean;
        scope?: string;
        sw?: string;
        runtimeCaching?: unknown[];
        publicExcludes?: string[];
        buildExcludes?: (string | RegExp)[];
        fallbacks?: {
            document?: string;
            image?: string;
            audio?: string;
            video?: string;
            font?: string;
        };
        cacheOnFrontEndNav?: boolean;
        reloadOnOnline?: boolean;
        workboxOptions?: Record<string, unknown>;
    }

    export default function withPWAInit(
        config: PWAConfig
    ): (nextConfig: NextConfig) => NextConfig;
}
