import { BadRequestException, NotFoundException } from "../../common/utils/index.js"
import { deleteOne, find, findOne, updateOne } from "../../DB/database.service.js"
import { MessageModel, UserModel } from "../../DB/index.js"
import { createNotification } from "../notifications/notification.service.js"


export const sendMessage = async (receiverId, files = [], payload = {}, user) => {
  const normalizedReceiverId = receiverId || payload?.receiverId
  const rawContent = typeof payload?.content === "string" ? payload.content : ""
  const content = rawContent.trim()

  if (!normalizedReceiverId) {
    throw BadRequestException({ message: "receiverId is required" })
  }

  const receiver = await findOne({
    model: UserModel,
    filter:{
      _id:normalizedReceiverId,
      confirmEmail:{$exists:true}
    },
  })
  if (!receiver) {
    throw NotFoundException({message:"No matching account"})
  }

  if (!content && !files?.length) {
    throw BadRequestException({ message: "Message content or attachments are required" })
  }

  const message = await MessageModel.create({
    content: content || undefined,
    attachments: files.map(file => file.finalPath),
    receiverId: normalizedReceiverId,
    senderId: user ? user._id : undefined
  })

  // Fire a notification for the receiver (non-blocking)
  createNotification({
    userId: normalizedReceiverId,
    type: "new_message",
    title: "New Anonymous Message",
    body: content
      ? content.length > 60
        ? content.slice(0, 60) + "..."
        : content
      : "You received a new attachment message",
    meta: { messageId: message._id },
  }).catch(() => {})   // swallow notification errors so message send always succeeds

  return message
}

export const getMessageById = async (messageId, user) =>{
  const message = await findOne({
    model:MessageModel,
    select: "-senderId",
    filter:{
      _id: messageId,
      $or:[
        {senderId: user._id},
        {receiverId: user._id}
      ],
    }
  })
  if (!message) {
    throw NotFoundException({message:"Invalid message id or not authorized action"})
  }
  return message
}

export const deleteMessageById = async (messageId, user) =>{
  const message = await deleteOne({
    model:MessageModel,
    filter:{
      _id: messageId,
      receiverId: user._id,
    },
  })
  if (!message.deletedCount) {
    throw NotFoundException({message:"Invalid message id or not authorized action"})
  }
  return message
}

export const getAllMessages = async (user, { page = 1, limit = 20 } = {}) =>{
  const skip = (page - 1) * limit
  const messages = await find({
    model:MessageModel,
    filter:{
      $or:[
        {senderId: user._id},
        {receiverId: user._id}
      ],
    },
    options: { skip, limit, sort: { createdAt: -1 } }
  })
  return messages
}

/**
 * Get only received messages (inbox) for a user
 */
export const getInboxMessages = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit
  const messages = await find({
    model: MessageModel,
    filter: { receiverId: userId },
    select: "-senderId",   // always hide sender for inbox
    options: { skip, limit, sort: { createdAt: -1 } }
  })
  return messages
}

/**
 * Get only sent messages for a user
 */
export const getSentMessages = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit
  const messages = await find({
    model: MessageModel,
    filter: { senderId: userId },
    options: {
      skip,
      limit,
      sort: { createdAt: -1 },
      populate: { path: "receiverId", select: "firstName lastName username email profilePicture" }
    }
  })
  return messages
}
