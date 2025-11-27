// Simple request queue to prevent too many simultaneous requests
class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private running = 0
  private maxConcurrent = 2 // Maximum 2 concurrent requests
  private delayBetweenRequests = 300 // 300ms delay between requests

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    this.running++
    const task = this.queue.shift()
    
    if (task) {
      try {
        await task()
      } catch (error) {
        // Error already handled in task
      }
      
      // Add delay before processing next request
      await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests))
    }
    
    this.running--
    
    // Process next task
    if (this.queue.length > 0) {
      this.process()
    }
  }
}

export const requestQueue = new RequestQueue()

