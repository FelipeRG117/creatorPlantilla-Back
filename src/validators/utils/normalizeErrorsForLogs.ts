import { AppErrorInterface } from '@/lib/config/types/env'
import React from 'react'
import { handleTransformError } from './handleTransformError'

export const normalizeErrorsForLogs = (error: unknown):AppErrorInterface[] => {
    const transformedError = handleTransformError(error);
    return Array.isArray(transformedError)? transformedError : [transformedError]
}
