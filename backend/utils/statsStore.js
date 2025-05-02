// backend/utils/statsStore.js
module.exports = {
    stats: {
      unprocessedCount: 0,
      processedCount: 0,
      totalProcessed: 0,
      reverifiedCount: 0
    },
    updateUnprocessed(count) {
      this.stats.unprocessedCount = count;
    },
    updateProcessed(count) {
      this.stats.processedCount = count;
    },
    incrementProcessed() {
      this.stats.totalProcessed += 1;
    },
    incrementReverified() {
      this.stats.reverifiedCount += 1;
    }
  };

  
  