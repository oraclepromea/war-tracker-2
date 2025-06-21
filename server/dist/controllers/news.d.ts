import { Request, Response } from 'express';
export declare class NewsController {
    static getNews(req: Request, res: Response): Promise<void>;
    static getLatestNews(req: Request, res: Response): Promise<void>;
}
