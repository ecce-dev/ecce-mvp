export type ServerActionResult<T> =
| { success: true; result: T }
| { success: false; error: string };

export class ServerActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServerActionError";
  }
}

export function createServerAction<Return, Args extends unknown[] = []>(
  callback: (...args: Args) => Promise<Return>,
): (...args: Args) => Promise<ServerActionResult<Return>> {
  return async (...args: Args) => {
    try {
      const result = await callback(...args);
      return { success: true, result };
    } catch (error) {
      if (error instanceof ServerActionError) {
        return { success: false, error: error.message };
      }
      console.error(error)
      return { success: false, error: "Something went wrong..." };
    }
  };
}