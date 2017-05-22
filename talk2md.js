const request = require('request-promise');
const natsort = require('natsort');
const config = require('./talk2md_config.json')
const fs = require('fs')
const api_key = process.env.api_key
const api_username = process.env.api_username
const auth_url = "api_key=" + api_key + "&api_username=" + api_username

var sorter = natsort();

async function getMergedContentFromTalk(category_id) {

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

async function getSubCategoriesFromRoot(root_category_id) {

    console.log("GET SUB NAME FROM ROOT ID : " + root_category_id)

    res = await request.get("https://talk.pdis.nat.gov.tw/site.json?" + auth_url)

    sub_categories = JSON.parse(res).categories
        .filter(category => category.parent_category_id === root_category_id)
        .map((category) => {
            return { 'id': category.id, 'name': category.name }
        })

    return sub_categories
}

async function createSummary(sub_categories) {

    console.log("CREATE SUMMARY.MD")

    // TOC
    summary = "# Summary\n\n"
    summary += "### " + config.BookTitle + "\n\n"
    summary += "* [簡介](README.md)\n"
    for (category of sub_categories) {
        summary += "* [" + category.name + "](" + category.name + ".md)\n"
    }

    fs.writeFileSync("infra/SUMMARY.md", summary)

}

async function createIntroduction(intro_topic_id) {

    console.log("CREATE README.MD")
    res = await request.get("https://talk.pdis.nat.gov.tw/t/" + intro_topic_id + ".json?include_raw=1&" + auth_url)
    content = JSON.parse(res).post_stream.posts[0].raw
    fs.writeFileSync("infra/README.md", content)

}

async function appendFAQ(FAQ_topic_id) {

    console.log("APPEND FAQ TO SUMMARY")
    res = await request.get("https://talk.pdis.nat.gov.tw/t/" + FAQ_topic_id + ".json?include_raw=1&" + auth_url)
    content = "\n\n### 常見問答\n\n"
    content += JSON.parse(res).post_stream.posts[0].raw
    fs.appendFileSync("infra/SUMMARY.md", content)

}

(async function() {

    sub_categories = await getSubCategoriesFromRoot(121)

    createSummary(sub_categories)

    createIntroduction(config.IntroductionID)

    appendFAQ(config.FAQID)

    for (category of sub_categories) {
        console.log("\n===================================================\n")
        content = await getMergedContentFromTalk(config.RootCategoryID + "/" + category.id)
        content =
            "# " + category.name + "\n\n" +
            "-----\n\n" +
            content
        fs.writeFileSync('infra/' + category.name + '.md', content)
        console.log(category.name + '.md OK!!')
    }

    console.log("DONE!!")

}())