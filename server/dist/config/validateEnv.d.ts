export declare function validateEnvironment(): void;
export declare function getConfig(): {
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        name: string;
    };
    redis: {
        url: string;
    };
    apis: {
        acled: {
            key: string;
            email: string;
        };
        newsapi: {
            key: string;
        };
        guardian: {
            key: string;
        };
    };
    app: {
        nodeEnv: string;
        port: number;
        frontendUrl: string;
    };
    jobs: {
        enabled: boolean;
        concurrency: number;
    };
};
