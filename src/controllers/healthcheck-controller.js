import ApiResponse from "../utils/api-response.js";
import {asyncHandler} from "../utils/asynhandler.js";
// const healthCheck = (req, res) => {
//   try {
//     res
//       .status(200)
//       .json(new ApiResponse(200, { message: "server is running " }));
//   } catch (error) {}
// };

const healthCheck = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, { message: "i am working.........." }));
});

export { healthCheck };
