const GITHUB_ACCOUNT = ''
const GITHUB_PASSWORD = ''

const api_key = ""
const api_username = ""
const auth_url = "api_key=" + api_key + "&api_username=" + api_username

const phantom = require('phantom');
const request = require('request-promise');
const natsort = require('natsort');
const config = require('./config.json')
var page;
var instance;
var sorter = natsort();

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function hackmdLogin() {

    console.log("LOGIN TO GITHUB")

    instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=no']);
    page = await instance.createPage();
    await page.property('viewportSize', { width: 1280, height: 1024 })
    await page.open('https://hackmd.io/auth/github');

    await timeout(2000)
    await page.render("1.png")

    await page.evaluate(function(GITHUB_ACCOUNT, GITHUB_PASSWORD) {
        login_field.value = GITHUB_ACCOUNT
        password.value = GITHUB_PASSWORD
        document.querySelector('form').submit()
    }, GITHUB_ACCOUNT, GITHUB_PASSWORD)

}

async function postContentToHackMD(hackmd_id, content) {

    console.log("OPEN HACKMD ID : " + hackmd_id)

    await page.open('https://pdis.tw')
    await timeout(2000)
    await page.open('https://hackmd.io/' + hackmd_id + '?both')
    await timeout(2000)

    // await timeout(2000)
    // await page.evaluate(function() {
    //     document.querySelector('.dropdown-menu > .ui-permission-limited').click()
    // })

    await timeout(2000)
    await page.evaluate(function() {
        document.querySelector('.dropdown-menu > .ui-permission-locked').click()
    })

    console.log("UPDATE HACKMD ID : " + hackmd_id)

    await page.evaluate(function(content) {
        $('#clipboardModal').modal()
        $('#clipboardModalContent')[0].innerText = content
        $('#clipboardModalConfirm')[0].click()
    }, content)
    await timeout(5000)

};


async function getContentFromTalk(category_id) {

    console.log("GET TALK CONTENT FROM ID : " + category_id)

    all_topics = []
    all_QA = []
    all_content = ""
    count = 0

    do {
        res = await request.get("https://talk.pdis.nat.gov.tw/c/" + category_id + ".json?page=" + count + "&" + auth_url)
        topics = JSON.parse(res).topic_list.topics
        all_topics = all_topics.concat(topics)
        count += 1
    }
    while (topics.length > 0);

    for (let topic of all_topics) {
        if (topic.title.indexOf('對於分類：') < 0) {
            res = await request.get("https://talk.pdis.nat.gov.tw/t/" + topic.id + ".json?include_raw=1&" + auth_url)
            post = JSON.parse(res).post_stream.posts[0]
            all_QA.push({ 'q': topic.title, 'a': post.raw })
        }
    }

    all_QA.sort(function(a, b) {
        return sorter(a.q, b.q)
    })

    return all_QA.reduce((all_content, QA) => { return all_content += "## " + QA.q + "\n\n" + QA.a + "\n\n" }, "")
}

(async function() {

    await hackmdLogin()

    for (task of config) {
        console.log("\n\n===================================================\n\n")
        content = await getContentFromTalk(task.talk_id)
        await postContentToHackMD(task.hackmd_id, content)
    }

    instance.exit()

}())