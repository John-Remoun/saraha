import { Router } from "express";
import { BadRequestException, decodeToken, fileFieldValidation, localFileUpload, successResponse } from "../../common/utils/index.js";
import { deleteMessageById, getAllMessages, getMessageById, sendMessage, getInboxMessages, getSentMessages } from "./message.service.js";
import { validation } from "../../middleware/validation.middleware.js";
import { authentication } from "../../middleware/authentication.middleware.js";
import * as validators from './message.validation.js'
import { tokenTypeEnum } from "../../common/enums/security.enum.js";

const router = Router()

/**
 * POST /message/:receiverId
 * Send an anonymous (or authenticated) message to a user
 */
router.post(
  "/:receiverId",
  async (req, res, next) => {
    // Optional authentication – anonymous senders are allowed
    if (req.headers?.authorization) {
      try {
        const token = req.headers.authorization.split(" ")[1]
        const { user, decoded } = await decodeToken({ token, tokenType: tokenTypeEnum.access })
        req.user = user
        req.decoded = decoded
      } catch (_err) {
        // Ignore auth errors for anonymous sending
      }
    }
    next()
  },
  localFileUpload({customPath:"messages", validation:fileFieldValidation.image, maxSize:1}).array("attachments", 2),
  validation(validators.sendMessage),
  async(req, res, next) => {
    const receiverId = req.params?.receiverId;
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : req.body?.content;

    if (!receiverId) {
      throw BadRequestException({ message: "receiverId is required" });
    }

    if (!content && !req.files?.length) {
      throw BadRequestException({message:"validation error", extra:{message:"at least one key is required from [content, attachment]"}})
    }
    const message = await sendMessage(receiverId, req.files, { ...req.body, content }, req.user)
    return successResponse({res, status:201, data:{message}})
  })

/**
 * GET /message/inbox
 * Get received (inbox) messages for the authenticated user – sender hidden
 */
router.get("/inbox", authentication(), async(req, res, next) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 50)
  const messages = await getInboxMessages(req.user._id, { page, limit })
  return successResponse({res, status:200, data:{messages}})
})

/**
 * GET /message/sent
 * Get messages the authenticated user has sent
 */
router.get("/sent", authentication(), async(req, res, next) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 50)
  const messages = await getSentMessages(req.user._id, { page, limit })
  return successResponse({res, status:200, data:{messages}})
})

/**
 * GET /message/list
 * Get all messages (sent + received) for the authenticated user
 */
router.get("/list", authentication(), async(req, res, next) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 50)
  const messages = await getAllMessages(req.user, { page, limit })
  return successResponse({res, status:200, data:{messages}})
})

/**
 * GET /message/:messageId
 * Get a single message by ID
 */
router.get("/:messageId", authentication(), validation(validators.getMessage), async(req, res, next) => {
  const message = await getMessageById(req.params.messageId, req.user)
  return successResponse({res, status:200, data:{message}})
})

/**
 * DELETE /message/:messageId
 * Delete a message (receiver only)
 */
router.delete("/:messageId", authentication(), validation(validators.getMessage), async(req, res, next) => {
  const message = await deleteMessageById(req.params.messageId, req.user)
  return successResponse({res, status:200, data:{message}})
})

export default router
