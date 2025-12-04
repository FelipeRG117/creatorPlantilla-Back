import { AppErrorInterface, ErrorPriority } from "@/lib/config/types/env"
import { randomBytes } from "crypto"
import { ZodError, ZodIssueCode } from "zod"



export const handleZodError = (error: ZodError<unknown>):Array<AppErrorInterface> => {

const transformTypeZodError: Partial<Record<ZodIssueCode, ErrorPriority>>={
invalid_type: "high", 
unrecognized_keys: "medium", 
invalid_union: "low", 
invalid_arguments: "high", 
invalid_return_type: "medium", 
invalid_string: "high"
} as const 

const value = error.errors.map((err): AppErrorInterface=>({
    id: `zder-${randomBytes(16).toString("hex")}`, 
    code: "ZOD_ERROR",
    technicalMessage: err.message, 
    userMessage: "Type Error",
    priority: transformTypeZodError[err.code] ||"low", 
    timestamp: Date.now(), 
    metadata: {
        isRetryable: false 
    }

}))

  return value

}



/*     id: this.id, 
    code: this.code,
    technicalMessage: this.message, 
    userMessage: this.userMessage, 
    priority: this.priority, 
    timestamp: this.timestamp, 
    metadata: {
        isRetryable: this.isRetryable
    } */