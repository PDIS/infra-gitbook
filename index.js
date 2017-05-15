const GITHUB_ACCOUNT = ''
const GITHUB_PASSWORD = ''

const phantom = require('phantom');
const request = require('request-promise');

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}


async function postContentToHackMD(hackmd_id, content) {
    const instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=no']);
    const page = await instance.createPage();

    const status = await page.open('https://hackmd.io/auth/github');

    await page.property('viewportSize', { width: 1280, height: 1024 })

    // Login with Github
    await page.evaluate(function(GITHUB_ACCOUNT, GITHUB_PASSWORD) {
        login_field.value = GITHUB_ACCOUNT
        password.value = GITHUB_PASSWORD
        document.querySelector('form').submit()
    }, GITHUB_ACCOUNT, GITHUB_PASSWORD)

    // Go to hackmd page

    await timeout(5000)
    await page.open('https://hackmd.io/' + hackmd_id + '?both')


    await timeout(2000)
    await page.evaluate(function() {
        document.querySelector('.dropdown-menu > .ui-permission-limited').click()
    })

    await timeout(2000)
    await page.evaluate(function() {
        document.querySelector('.dropdown-menu > .ui-permission-locked').click()
    })

    await timeout(2000)
    await page.evaluate(function(content) {
        $('#clipboardModal').modal()
        $('#clipboardModalContent')[0].innerText = content
        $('#clipboardModalConfirm')[0].click()
    }, content)

    await instance.exit();
};


async function getContentFromTalk(category_id) {

}

(async function() {
    await postContentToHackMD('EYUwTA7MAcCGDGBaAZiEAGRAWAJiJwAzOIiAGwCsAjDhPmWDUA==', 'yooooooooo')
}())