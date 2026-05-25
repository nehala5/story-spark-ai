import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { User } from "../modules/user/user.model";
import { REQUEST_LIMITS } from "../../interfaces/ai_model_request_limit";
import ApiError from "../../errors/api_error";
import { JwtHalers } from "../../utils/jwt.helper";
import config from "../../config";
import { Secret } from "jsonwebtoken";

const checkRequestLimit =
  () => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization as string;
      if (!token) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "You are not authorized to access"
        );
      }
      const verifiedUser = JwtHalers.verifyToken(
        token,
        config.jwt.secret as Secret
      );
      const { email: userEmail } = verifiedUser;
      const user = await User.findOne({ email: userEmail });

      if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User not found!");
      }

      const currentDate = new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );

      // Reset the request count if the last request was in a previous month
      if (user.lastRequestDate && user.lastRequestDate < firstDayOfMonth) {
        user.requestsThisMonth = 0;
        user.lastRequestDate = currentDate;
      }

      const requestLimit =
        REQUEST_LIMITS[user.subscriptionType as keyof typeof REQUEST_LIMITS];

      // Check if the user has exceeded their monthly limit
      if (user.requestsThisMonth >= requestLimit) {
        throw new ApiError(
          httpStatus.CONFLICT,
          "Monthly request limit exceeded!"
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  };

export default checkRequestLimit;
