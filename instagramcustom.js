const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// This module exposes a function that accepts an Instagram URL and
// returns a direct video download URL (string) when possible.
// It mimics the cURL request to inflact.com by posting multipart/form-data
// and then grabbing the `download_url` field from the JSON response.
module.exports = async function instagramCustom(instaUrl) {
  try {
    if (!instaUrl || typeof instaUrl !== 'string') throw new Error('Invalid URL');

    // build multipart form body the same way the curl example does
    const form = new FormData();
    form.append('url', instaUrl);

    // build headers closely mirroring the curl example; some values may be stale but
    // the endpoint seems to require a valid cookie + client tokens or it returns 403.
    const headers = {
      // form.getHeaders() provides the multipart content-type
      ...form.getHeaders(),
      'accept': '*/*',
      'accept-language': 'fr-FR,fr;q=0.9',
      'baggage':
        'sentry-environment=production,sentry-public_key=1b282a50293c4c9738e871bb3fadd05c,sentry-trace_id=1b9239db41c34dc6a58c365c81c64d27,sentry-sampled=false,sentry-sample_rand=0.3561438362904905,sentry-sample_rate=0',
      // the cookies string is long; copy directly from the example
      'cookie':
        'ingramer_sid=nbunm1f88ek0h8bl61nnpaermk; gtm_exp=0da93fd61cacc5905dc58402ee62244c548719486645f3b4ae825c8b260ae1f6a%3A2%3A%7Bi%3A0%3Bs%3A7%3A%22gtm_exp%22%3Bi%3A1%3Bs%3A81%3A%22%7B%22DownloaderLimitExperiment%22%3A2%2C%22AdsProviders3%22%3A2%2C%22ViewerPriceExperimentSecond%22%3A2%7D%22%3B%7D; move_modal=8f1e82e7d677b8d6604bf6e20b84c4f2ddcd338da20784e2e64b35e6efb2059da%3A2%3A%7Bi%3A0%3Bs%3A10%3A%22move_modal%22%3Bi%3A1%3Bb%3A1%3B%7D; from_landing=21fb3640e438032a01ae19d86f8ad23ba384c0692f22312e7538cf7ab5874468a%3A2%3A%7Bi%3A0%3Bs%3A12%3A%22from_landing%22%3Bi%3A1%3Bs%3A10%3A%22downloader%22%3B%7D; _csrf=467ab555107ded47ada856c07f92f64fded547f8754bad828eb1cb3f9c1022c2a%3A2%3A%7Bi%3A0%3Bs%3A5%3A%22_csrf%22%3Bi%3A1%3Bs%3A32%3A%22eSgpuJrARNHBP1unWUcIMfhXW5eTjADC%22%3B%7D; _ga_8Z42FRJR0B=GS2.1.s1772713053%24o1%24g0%24t1772713053%24j60%24l0%24h477996104%24ds6WRi0IU239hR6_imtcqnrFnzeXx_vlgPA; _ga=GA1.1.144899862.1772713054; _gcl_au=1.1.377927718.1772713054; user_timezone=8ece8a71cebd1d2fd5f66af7d9370a72d015df096dd870656d1f75eb305f1288a%3A2%3A%7Bi%3A0%3Bs%3A13%3A%22user_timezone%22%3Bi%3A1%3Bs%3A12%3A%22Europe%2FParis%22%3B%7D; user:search:history=2aef6e8d763f63149b151cbe88cf31858bb2d89a4cdac1fba05b50aaa2e2f478a%3A2%3A%7Bi%3A0%3Bs%3A19%3A%22user%3Asearch%3Ahistory%22%3Bi%3A1%3Bs%3A15%3A%22%5B%22kazu.ma0825%22%5D%22%3B%7D; instagram_downloader=2ffc08aa32c6fe66e1984c72510ee033f48430a53a078b5383677966e1a5fa51a%3A2%3A%7Bi%3A0%3Bs%3A20%3A%22instagram_downloader%22%3Bi%3A1%3Bs%3A22%3A%22kazu.ma0825%7C1772713064%22%3B%7D',
      'origin': 'https://inflact.com',
      'priority': 'u=1, i',
      'referer': 'https://inflact.com/fr/instagram-downloader/video/',
      'sec-ch-ua':
        '"Not:A-Brand";v="99", "Brave";v="145", "Chromium";v="145"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'sec-gpc': '1',
      'sentry-trace':
        '1b9239db41c34dc6a58c365c81c64d27-a543023d57bff7ca-0',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'x-client-signature':
        '074685d2552eec3d14fce60b31b5535178d76845e2e831fd249c16b121a1711c',
      'x-client-token':
        'eyJ0aW1lc3RhbXAiOjE3NzI3MTMwNjUsImNsaWVudElkIjoiNDY4NmQxNDk1NTRmMDRkNTVhZjI3YWNjMTBjMzQyYWIiLCJub25jZSI6IjliNjU4Njk4OTE3NmEyYjY4NWZhNzgxZjFmNzQ0ZjI0In0='
    };

    const response = await axios.post(
      'https://inflact.com/downloader/api/downloader/post/',
      form,
      {
        headers,
        withCredentials: true,
        timeout: 15000
      }
    );

    if (!response || !response.data) throw new Error('No response from inflact');
    if (response.data.status !== 'success')
      throw new Error('inflact returned an error');

    // response.data.data.post.download_url contains the video link
    const downloadUrl =
      response.data.data &&
      response.data.data.post &&
      response.data.data.post.download_url;

    if (!downloadUrl) throw new Error('Download URL not found in inflact response');

    return downloadUrl;
  } catch (err) {
    throw new Error(`instagramCustom failed: ${err.message}`);
  }
};
