/**
 * Checks if a given error object from Supabase indicates a missing table,
 * function, or relation, which usually points to an incomplete DB setup.
 * @param err The error object to inspect.
 * @returns True if the error is likely a database setup issue.
 */
export const isDatabaseSetupError = (err: any): boolean => {
    if (!err) return false;

    const code = err.code;
    const message = err.message ? err.message.toLowerCase() : '';

    // Postgres error codes:
    // 42P01: undefined_table
    // 42883: undefined_function
    if (code === '42P01' || code === '42883') {
        return true;
    }

    // Check for common error messages
    if (
        message.includes('does not exist') ||
        message.includes('could not find the table') ||
        message.includes('relation') // "relation 'public.profiles' does not exist"
    ) {
        return true;
    }
    
    return false;
};
