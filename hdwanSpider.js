"use strict"

let http = require('http');
let request = require('superagent')
let charset = require('superagent-charset')
let cheerio = require('cheerio')
let fs = require('fs')
let path = require('path')

let moviePageUrlArr = []
async function hdwanSpider() {
    try {
        charset(request)
        let res = await request.get("http://www.hdwan.net").charset('utf8').timeout(50000)
        let $ = cheerio.load(res.text)
        let urlArr = []
        $('.topnav ul li a').each(function(i, e) {
            urlArr.push($(e).attr("href"))
        })
        let category = urlArr.map(async function(url) {
            await parseCategoryPage(url + '/page/', 1)
        })
        await Promise.all(category)
        console.log('Get all moive page url: success!')
        console.log('movie page url numbers: ' + moviePageUrlArr.length)
        let groupArr = splitMoviePageUrlArr()
        let torrentArr = []

        let pro = groupArr.map(async function(urlArr) {
            let __torrentArr = []
            urlArr.forEach(async function(u) {
                try {
                    charset(request)
                    let res = await request.get(u).charset('utf8')
                    let $ = cheerio.load(res.text)
                    $('.context #post_content div a').each((k, e) => {
                        __torrentArr.push($(e).attr("href"))
                        console.log($(e).attr("href"))
                    })
                } catch (err) {
                    console.log(u + ': ' + err.status)
                }
            })
            torrentArr.concat(__torrentArr)
        })
        await Promise.all(pro)
        console.log(torrentArr.length)
        fs.appendFile('torrent', torrentArr, 'utf8')
    } catch (err) {
        if (typeof(err.timeout) != 'undefined') {
            console.log(err.timeout)
        } else {
            console.log(err.status)
        }
        return
    }
}

function splitMoviePageUrlArr() {
    let result = []
    let k = 0
    for (let i = 0; i < moviePageUrlArr.length; i += 140) {
        let tmp = []
        for (let j = 0; j < 140; ++j) {
            if (i + j == moviePageUrlArr.length) {
                break
            } else {
                tmp[j] = moviePageUrlArr[i + j]
            }
        }
        result.push(tmp)
    }
    return result
}
async function parseCategoryPage(url, i) {
    try {
        charset(request)
        let res = await request.get(url + i.toString()).charset('utf8').timeout(50000)
        let $ = cheerio.load(res.text)
        $('#post_container li div.thumbnail a').each((j, e) => {
            moviePageUrlArr.push($(e).attr("href"))
        })
        await parseCategoryPage(url, i + 1)
    } catch (err) {
        if (typeof(err.timeout) != 'undefined') {
            console.log(url + ': ' + err.timeout)
            await parseCategoryPage(url, i)
        } else {
            console.log(url + i.toString() + ': ' + err)
            return
        }
    }
}
hdwanSpider()
//module.exports = hdwanSpider()
