VkUploadError = class VkUploadError extends Error {
  /**
   * Constructor.
   * @param  {Object} error Vkontakte error object
   *   @property {String} error Error
   * @return {this}
   */
  constructor (error = {}) {
    super(error.error);

    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
  }
}

export { VkUploadError };
