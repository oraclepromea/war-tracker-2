import { Request, Response } from 'express';
export declare class EventsController {
    static getEvents(req: Request, res: Response): Promise<void>;
    static getEventById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getRecentEvents(req: Request, res: Response): Promise<void>;
}
