const { igdl } = require('ab-downloader');

module.exports = async function instagramCustom(instaUrl) {
  try {
    if (!instaUrl || typeof instaUrl !== 'string') {
      throw new Error('Invalid URL');
    }

    const data = await igdl(instaUrl);

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No content found');
    }

    // Assuming the first element contains the desired URL
    const downloadUrl = data[0].url;

    if (!downloadUrl) {
      throw new Error('Download URL not found in the response');
    }

    return downloadUrl;
  } catch (err) {
    // It's good practice to wrap the original error message
    throw new Error(`instagramCustom failed: ${err.message}`);
  }
};
