import express from 'express';

declare global {
  namespace Express {
    interface Request {
      body?: any;
      params?: any;
      query?: any;
    }
    interface Response {
      json(body?: any): Response;
      status(code: number): Response;
    }
  }
}

export {};