import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catch_async";
import sendResponse from "../../../shared/send_response";
import { AiModelService } from "./ai_model.service";
import { getToken } from "../../middleware/token";
import { FreeUsage } from "./free_usage.model";

const FREE_STORY_LIMIT = 3;

const aiModelGenerate = catchAsync(async (req: Request, res: Response) => {
  const prompt = req.body;
  const token = await getToken(req);
  const result = await AiModelService.aiModelGenerate(prompt, token);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stories generated successfully!",
    data: result,
  });
});

const aiFreeModelGenerate = catchAsync(async (req: Request, res: Response) => {
  const prompt = req.body;

  // Use IP address as identifier for persistent, non-spoofable tracking
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const currentDate = new Date();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );

  // Find or create usage record for this IP
  let usageRecord = await FreeUsage.findOne({ ip });

  if (!usageRecord) {
    usageRecord = await FreeUsage.create({
      ip,
      requestsThisMonth: 0,
      lastRequestDate: currentDate,
    });
  }

  // Reset count if last request was in a previous month
  if (usageRecord.lastRequestDate && usageRecord.lastRequestDate < firstDayOfMonth) {
    usageRecord.requestsThisMonth = 0;
    usageRecord.lastRequestDate = currentDate;
  }

  if (usageRecord.requestsThisMonth >= FREE_STORY_LIMIT) {
    return sendResponse(res, {
      statusCode: httpStatus.FORBIDDEN,
      success: false,
      message: `You have reached the maximum limit of ${FREE_STORY_LIMIT} free story generations per month.`,
    });
  }

  const result = await AiModelService.aiFreeModelGenerate(prompt);

  usageRecord.requestsThisMonth += 1;
  usageRecord.lastRequestDate = currentDate;
  await usageRecord.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Story generated successfully!",
    data: result,
  });
});

export const AiModelController = {
  aiModelGenerate,
  aiFreeModelGenerate,
};
