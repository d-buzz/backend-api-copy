let allUsers = []
let allContent = []
let converter = new showdown.Converter({ tables: true })
let totalVestingShares, totalVestingFundSteem;

/**
 * gets totalVestingShares and totalVestingFundSteem from STEEM API to use later
 */
steem.api.getDynamicGlobalProperties((err, result) => {
  totalVestingShares = result.total_vesting_shares;
  totalVestingFundSteem = result.total_vesting_fund_steem;
})

/**
 * Calls steem api for current top 20 trending tags
 * @function
 */
function getTrendingTags(){
  steem.api.getTrendingTags('', 20, (err, result) => {
    if (err) return console.log(err);
    displayTrendingTags(result)
  });
}

/**
 * Gets a set of posts trending from the the steem api
 * @function
 * @param {Object} query - a steem feed query object - {tag: 'photography', 'limit': 20 }
 * @param {Boolean} initial - If this is an initial call or a call from 'get-more-posts' to add aditional posts to feed
 */
function getTrending(query, initial){
  steem.api.getDiscussionsByTrending(query, (err, result) => {
    if (err === null) {
      displayContent(result,initial)
      getaccounts(result.map(post => post.author))
    } else {
      console.log(err);
    }
  });
}

/**
 * Gets a set of latest posts from the the steem api
 * @function
 * @param {Object} query - a steem feed query object - e.g {tag: 'photography', 'limit': 20 }
 * @param {Boolean} initial - If this is an initial call or a call from 'get-more-posts' to add aditional posts to feed
 */
function getLatest(query, initial){
  steem.api.getDiscussionsByCreated(query, (err, result) => {
    if (err === null) {
      displayContent(result, initial)
      getaccounts(result.map(post => post.author))
    } else {
      console.log(err);
    }
  });
}

/**
 * Gets a set of latest posts from specific author
 * @function
 * @param {Object} query - a steem feed query object - e.g {tag: 'ausername', 'limit': 20 }
 * @param {Boolean} initial - If this is an initial call or a call from 'get-more-posts' to add aditional posts to feed
 */
function getBlog(query, initial){
  steem.api.getDiscussionsByBlog(query, (err, result) => {
      displayContent(result, initial)
  })
}

/**
 * Gets a set of latest posts from specific authors feed (who they follow)
 * @function
 * @param {Object} query - a steem feed query object - e.g {tag: 'username', 'limit': 20 }
 * @param {Boolean} initial - If this is an initial call or a call from 'get-more-posts' to add aditional posts to feed
 */
function getUserFeed(query, initial){
  steem.api.getDiscussionsByFeed(query, (err, result) => {
    console.log(result)
    displayContent(result,initial)
  });
}

/**
 * Adds more posts to the current feed view
 * @function
 * @param {String} filter - 'latest', 'trending', 'user-feed'
 * @param {boolean} tag - a tag used on posts
 */
function getMoreContent(filter, tag){
  let lastItem = allContent[allContent.length - 1]
  let username = $('main').data('username')
  let query = {
      tag: tag,
      limit: 24,
      start_author: lastItem.author,
      start_permlink: lastItem.permlink }

      if(filter === 'trending'){
        getTrending(query, false)
      } else if(filter === 'latest'){
        getLatest(query, false)
      } else if(filter === 'user-feed'){
        query.tag = username
        console.log(query)
        getUserFeed(query, false)
      } else {
        query.tag = username
        getBlog(query, false)
      }
}

/**
 * Adds more posts to the current feed view
 * @function
 * @param {Array} result - An Array of Steem posts from the STEEM API
 * @param {Boolean} initial - If this is an initial call or a call from 'get-more-posts' to add aditional posts to feed
 */
function displayContent(result, initial){
  console.log('should return results', result)

  if (!initial) result.shift()

  for (let i = 0; i < result.length ; i++) {
      let post = result[i];
      console.log('testing',post)
      //add restrictor for category: "hive-153112"
      result = result.filter(post => post.category === 'hive-153112')
      // console.log(result);
      allContent.push(result)
      // allContent.push(post)

      var urlRegex = /(https?:\/\/[^\s]+)/g;
      post.body = post.body.replace(urlRegex, (url) => {
        let last = url.slice(-3)
        if ( last === 'jpg' || last === 'png' || last === 'jpe' || last === 'gif' )  {
          return '<img src="' + url + '">';
        } else { return url }
      })

      if( typeof JSON.parse(post.json_metadata).image === 'undefined' ){
        image = genImageInHTML(post.body)
      } else {
        image = JSON.parse(post.json_metadata).image[0]
      }


      //removed <img class="item__image " src="https://steemitimages.com/512x512/${image}" onerror=""> causing error
      let itemTemplate = `
        <div class="item " data-post-id="${post.id}" data-url="${post.url}" data-permlink="${ post.permlink }">

          <div class="item__meta">
            <a href="${post.url}"><h3>${post.title}</h3></a>
            <a href="/@${post.author}"><span>@${post.author}</span></a>
            <form method="post">
              <input type="hidden" name="postId" value="${post.id}">
              <input type="hidden" name="author" value="${post.author}">
              <input type="hidden" name="permlink" value="${post.permlink}">
              <input type="text" name="category" value="${post.category}">
              <input type="submit" class="vote" value="Vote">
              <input type="submit" class="downVote" value="downVote">
            </form>
          </div>
        </div>
        `
        $('.feed-insert').append(itemTemplate)
  }
}

/**
 * Adds an array of tags to the page
 * @function
 * @param {Array} tags - An Array of Steem tags from the STEEM API
 */
function displayTrendingTags(tags){
  let feedType = $('main.feed').data('feed-type')

  for (var i = 1; i < tags.length; i++) {
    let tag = tags[i]
    let template = `<a class="btn btn-outline-dark" href="/feed/${feedType}/${tag.name}">${tag.name}</a>`

    $('.trending__tags').append(template)
  }
}

/**
 * calls the steem api for a list of accounts - adds them to allUsers global var
 * @function
 * @param {Array} username - an array of steem usernames e.g ['fred', 'bob', 'ned']
 */
function getaccounts(usernames){
  steem.api.getAccounts(usernames, (err, result) => {
    allUsers = allUsers.concat(result)
  })
}

/**
 * Gets the first image from a set of markdown where possible
 * @function
 * @param {String} markdown - A String containing markdown formatted text
 */
function genImageInHTML(markdown){
    let placeholder = document.createElement('div');
    placeholder.innerHTML = converter.makeHtml(markdown)
    let image = placeholder.querySelector('img') ;
    if (image) {
      return image.src
    } else {
      return false
    }
}

/**
 * Gets post and comment data for a url slug
 * @function
 * @param {String} url - '/category}/username/permlink'
 */
function getPostAndComments(url) {
  steem.api.getState(url, (err, result) => {
    let users = result.accounts;
    let resultsArray = [];
    for ( post in result.content ){

      var html = result.content[post].body

      resultsArray.push({
        id: result.content[post].post_id,
        title: result.content[post].root_title,
        author: result.content[post].author,
        body: html,
        json: result.content[post].json_metadata,
        permlink: result.content[post].permlink,
        depth: result.content[post].depth,
        root_comment: result.content[post].root_comment,
        parent_permlink: result.content[post].parent_permlink,
        created: result.content[post].created,
        votes: result.content[post].net_votes,
        voters: result.content[post].active_votes.map(vote => vote.voter),
        value: Math.round( parseFloat(result.content[post].pending_payout_value.substring(0,5)) * 100) / 100
      })
    }

    // Sort By Date/ID
    resultsArray = resultsArray.sort((a,b) => {
      return b.id - a.id
    });

    // Find Deepest Comment
    let maxDepthComment = resultsArray.reduce((prev, current) => {
      return (prev.depth > current.depth) ? prev : current
    })

    // Multi demention array by
    let resultsByDepth = [];
    for (var i = 0; i < maxDepthComment.depth + 1; i++) {
      resultsByDepth.push(resultsArray.filter(elem => {
        return elem.depth === i
      }))
    }
    appendSinglePost(resultsByDepth[0][0], users)
    appendComments(resultsByDepth)

  })
}

/**
 * gets a profile image from a steem users data where possible
 * @function
 * @param {Object} author - an author object from a steem api request
 */
function generateProfileImage(author){
  let profileImage = 'img/default-user.jpg';

  try {
    if (author.json_metadata === '' || typeof author.json_metadata === 'undefined' ) {
      author.json_metadata = { profile_image : false }
    } else {
      author.json_metadata = JSON.parse(author.json_metadata).profile
    }

    profileImage = author.json_metadata.profile_image ? 'https://steemitimages.com/128x128/' + author.json_metadata.profile_image : '';

  } catch(err){
    console.log(err)
  }
  return profileImage
}

/**
 * appends the main part of a post to the page
 * @function
 * @param {Object} post - steem post object from getPostAndComments()
 * @param {Array} users - an Array of steem user accounts from steem api
 */
function appendSinglePost(post, users){
  let author = users[post.author]
  console.log("HEY:", post)
  let html = converter.makeHtml(post.body)
  let profileImage = generateProfileImage(author)

  let tags = JSON.parse(post.json).tags.reduce( (all,tag) => all + `<span>${tag}</span>`, '')
  let header = `
    <img src="${profileImage}" class="author-img" width="35" height="35" src="">
    <a href="/@${post.author}" class="author-username">@${post.author}</a>
    <div class="tags">${tags}</div>
    <h2 class="title">${post.title}</h2>
    <input type="submit" class="follow" value="follow">
  `
  let voteButton = `
  <form method="post">
    <input type="hidden" name="postId" value="${post.id}">
    <input type="hidden" name="author" value="${post.author}">
    <input type="hidden" name="permlink" value="${post.permlink}">
    <input type="submit" class="vote" value="Vote">
  </form>`

  //this is the downvote button
  let downVoteButton = `
  <form method="post">
    <input type="hidden" name="postId" value="${post.id}">
    <input type="hidden" name="author" value="${post.author}">
    <input type="hidden" name="permlink" value="${post.permlink}">
    <input type="submit" class="downVote" value="DownVote">
  </form>
  `

  let commentBox = `
  <div>
    <textarea class="comment-message" rows="5"></textarea>
    <span class="send-comment" data-parent="${post.author}" data-parent-permlink="${post.permlink}" data-parent-title="${post.title}">Post Comment</span>
  </div>
  `
  $('main').append(header + html + voteButton + commentBox)
}

/**
 * appends comments to single page after main content
 * @function
 * @param {Array} comments - an Array of comments to a steem post
 */
function appendComments(comments){
  $('main').append('<div class="comments"></div>')

    comments.forEach( (postsAtDepth, i, arr) => {
      postsAtDepth.forEach( (comment, i, arr) => {
        let template = createCommentTemplate(comment)
        if ( comment.depth === 1 ) {
          $('.comments').prepend( template)
        } else if ( comment.depth  > 1) {
          var permlink = comment.parent_permlink
          $('.' + permlink ).append( template)
        }
      })
    })
}

/**
 * creates the HTML for a comment from a comment object
 * @function
 * @param {Object} post - a comment object from STEEM  getState API
 */
createCommentTemplate = (post) => {
      var permlink = post.parent_permlink
      var html = converter.makeHtml(post.body)
      var voteMessage = (post.votes > 1 || post.votes == 0 )? 'votes' : 'vote'
      var voteValue = (post.value > 0) ? '</span> <span>|</span> <span>$' + post.value  + '</span><span>': ''
      var template = `
      <div data-post-id="${post.id}"
      data-permlink="${post.permlink}"
      data-author="${post.author}"
      data-title="${post.title}"
      data-post-depth="${post.depth}"
      class="comment comment-level-${post.depth} ${post.permlink}">
        <h4>
          <a href="/@${post.author}" target="_blank">@${post.author}</a>
          <span> &middot; </span> <span> ${ moment(post.created).fromNow() } </span>
        </h4>
        <p>${ html }</p>
        <div class="meta">
          <form method="post">
            <input type="hidden" name="postId" value="${post.id}">
            <input type="hidden" name="author" value="${post.author}">
            <input type="hidden" name="permlink" value="${post.permlink}">
            <input type="submit" class="vote" value="Vote">
            <input type="submit" class="downVote" value="downVote">
          </form>
          <span class="sc-item__divider">|</span>
          <span class="sc-item__votecount">${post.votes} ${voteMessage} </span>
        </div>
      </div>`
      return template;
    }

/**
 * format raw user account data from Steem api
 * @function
 * @param {String} username - a single steem username
 * @param {String} scuser
 */
function getAccountInfo(username,scuser, callback) {
    let userInfo;

    return new Promise((resolve, reject) => {

      steem.api.getAccounts([username], (err, result) => {

        let user = result[0]

        let jsonData;

        try {jsonData = JSON.parse(user.json_metadata).profile} catch(err) { console.log(err)}
        console.log(jsonData)
        // steem power calc
        let vestingShares = user.vesting_shares;
        let delegatedVestingShares = user.delegated_vesting_shares;
        let receivedVestingShares = user.received_vesting_shares;
        let steemPower = steem.formatter.vestToSteem(vestingShares, totalVestingShares, totalVestingFundSteem);
        let delegatedSteemPower = steem.formatter.vestToSteem((receivedVestingShares.split(' ')[0])+' VESTS', totalVestingShares, totalVestingFundSteem);
        let outgoingSteemPower = steem.formatter.vestToSteem((receivedVestingShares.split(' ')[0]-delegatedVestingShares.split(' ')[0])+' VESTS', totalVestingShares, totalVestingFundSteem) - delegatedSteemPower;

        // vote power calc
        let lastVoteTime = (new Date - new Date(user.last_vote_time + "Z")) / 1000;
        let votePower = user.voting_power += (10000 * lastVoteTime / 432000);
        votePower = Math.min(votePower / 100, 100).toFixed(2);

        //this is the declaration for the data object which holds the data for the profiles
        //added the steemitimages.com so that the cover will show.

        let data = {
          name: user.name,
          image: jsonData.profile_image ? 'https://steemitimages.com/512x512/' + jsonData.profile_image : '',
          cover: jsonData.cover_image ? 'https://steemitimages.com/2048x512/' + jsonData.cover_image : '',
          rep: steem.formatter.reputation(user.reputation),
          effectiveSp: parseInt(steemPower  + delegatedSteemPower - -outgoingSteemPower),
          sp: parseInt(steemPower).toLocaleString(),
          delegatedSpIn: parseInt(delegatedSteemPower).toLocaleString(),
          delegatedSpOut: parseInt(-outgoingSteemPower).toLocaleString(),
          vp: votePower,
          steem: user.balance.substring(0, user.balance.length - 5),
          sbd: user.sbd_balance.substring(0, user.sbd_balance.length - 3),
          numOfPosts: user.post_count,
          followerCount: '',
          followingCount: '',
          //added followers & following to show all the users
          follower: '',
          following: '',
          usdValue: '',
          createdDate: new Date (user.created)
        }

        //this function is for getting the count for the followers
        steem.api.getFollowCount(user.name, function(err, result){
          data.followerCount = result.follower_count
          data.followingCount = result.following_count
          resolve(data)
        })

        //this function should handle to get all the names of the followees
        //this should be invoked!
        steem.api.getFollowers(user.name, null, "blog", 1000, function(err, result){
          for (let i = 0; i < result.length ; i++) {
            if (result[i].follower == scuser){
              data.following = true
              console.log("followed")
              break
            }else {
              data.following = false
              console.log("not followed")
            }
          }
          callback(data);
        })


        data.usdValue = steem.formatter.estimateAccountValue(user)
      })
    });
}

/**
 * adds account transactions to user transfers page
 * @function
 * @param {String} username - a single steem username
 */
function getAccountTransactions(username) {
  steem.api.getAccountHistory(username, -1, 10000, function(err, result){
    if (err) throw err

    result.forEach((tx, i) => {
      let txTime = new Date(tx[1].timestamp).valueOf()
      if(tx[1].op[0] === 'transfer') {
        let row = `<tr>
          <td>${moment(txTime).fromNow()}</td>
          <td>Transfer: ${tx[1].op[1].amount} from: ${tx[1].op[1].from} To: ${tx[1].op[1].to}
          <td class="table-cell-break">${tx[1].op[1].memo}</td>
        </tr>`
        $('.account-history tbody').append(row)
      }
      if(tx[1].op[0] == 'claim_reward_balance'){
        let row = `<tr>
        <td>${moment(txTime).fromNow()}</td>
        <td>Claim Reward ${tx[1].op[1].reward_sbd} ${tx[1].op[1].reward_steem} ${vestsToSteem(parseFloat(tx[1].op[1].reward_vests)).toFixed(3)}SP</td>
        <td></td>
        </tr>`
        $('.account-history tbody').append(row)
      }
    })
  })
}

/**
 * helper to format vests to readable Steem power number
 * @function
 * @param {String} username - a single steem username
 */
function vestsToSteem(vests){
  return steem.formatter.vestToSteem(vests, totalVestingShares, totalVestingFundSteem);
}

// On Page Load

if ($('main').hasClass('feed') ) {
    let feedType = $('main.feed').data('feed-type')
    let tag = $('main.feed').data('tag') || ''
    if(feedType === 'trending'){
      getTrendingTags()
      getTrending({tag, 'limit': 20 }, true)
    } else if (feedType === 'user-feed'){
      let username = $('main').data('username')
      getUserFeed({ tag: username, limit: 20 }, true)
    } else {
      getTrendingTags()
      getLatest({tag, 'limit': 20 }, true)
    }
}

if ($('main').hasClass('single')) {
  let data = $('main').data()
  getPostAndComments(`/${data.category}/@${data.username}/${data.permlink}`)
}

if ($('main').hasClass('dashboard')) {
  let username = $('main').data('username')
  getUserFeed(username)
}

if ($('main').hasClass('transfers')){
  let username = $('main').data('username')
  getAccountTransactions(username)
  getAccountInfo(username).then(data => {
    console.log(data)
    let template =`
      <div class="balances">
        <h5>STEEM: ${data.steem} </h5>
        <h5>STEEM Power: ${data.sp}</h5>
        <h5>SBD: ${data.sbd} </h5>
      </div>
    `
    $('.wallet').append(template)
  })
}


//this function would handle the profile header
//what to do show the followers




function processResponse( data ) {
  data.cover = data.cover || 'http://placehold.it/1200x300?text=-'

  console.log('This is a test', data)
    //transfer the follow button that was set to the main
    let followButton = `
      <form method="post">
        <input type="hidden" name="follow" value="${data.name}">
        <input type="submit" class="vote" value="Vote">
      </form>`


    let template =
      `<header class="profile__header" style="background-image: url(${data.cover})">
      <h2>${data.name} [${data.rep}]</h2>
      <img src="${data.image}" width="100px">
      <h5>Followers: ${data.followerCount} - Following: ${data.followingCount}</h5>
      <input type="submit" class="follow" value="follow">
      </header>`

    //code here for the if statement
    $('main').prepend(template + followButton)
    let following = data.following
    if(following){console.log("You have followed this account")
    }else{console.log("You have not yet followed this account")}
    // console.log(data);
}

if ($('main').hasClass('profile') ) {

  let user = $('.profile').data('user')
  let username = $('.profile').data('username')
  getAccountInfo(username, user, processResponse)
  let query = { tag: username, limit: 10 }
  getBlog(query, true)
}

// UI Actions
//This action is for the upvote
$('main').on('click', '.vote',(e) => {
  let $voteButton = $(e.currentTarget)
  e.preventDefault()
  $.post({
    url: '/post/vote',
    dataType: 'json',
    data:  $(e.currentTarget).parent().serialize()
  }, (response) => {
    if (response.error) {
      $(`<span>${response.error.error_description}</span>`).insertAfter($voteButton)
    } else {
      $('<span>Voted!</span>').insertAfter($voteButton)
    }
  })
})

// UI Actions
//This action is for the upvote
$('main').on('click', '.follow',(e) => {
  let $followButton = $(e.currentTarget)
  e.preventDefault()
  $.post({
    url: '/post/follow',
    dataType: 'json',
    data:  $(e.currentTarget).parent().serialize()
  }, (response) => {
    if (response.error) {
      $(`<span>${response.error.error_description}</span>`).insertAfter($followButton)
    } else {
      $('<span>Followed!</span>').insertAfter($followButton)
    }
  })
})

//this is feature that will unfollow the selected username
$('main').on('click', '.unfollow',(e) => {
  let $unfollowButton = $(e.currentTarget)
  e.preventDefault()
  $.post({
    url: '/post/unfollow',
    dataType: 'json',
    data:  $(e.currentTarget).parent().serialize()
  }, (response) => {
    if (response.error) {
      $(`<span>${response.error.error_description}</span>`).insertAfter($followButton)
    } else {
      $('<span>Unfollowed!</span>').insertAfter($followButton)
    }
  })
})


// this is the downvote function
$('main').on('click', '.downVote',(e) => {
  let $DownVoteButton = $(e.currentTarget)
  e.preventDefault()
  $.post({
    url: '/post/downVote',
    dataType: 'json',
    data:  $(e.currentTarget).parent().serialize()
  }, (response) => {
    if (response.error) {
      $(`<span>${response.error.error_description}</span>`).insertAfter($DownVoteButton)
    } else {
      $('<span>DownVoted!</span>').insertAfter($voteButton)
    }
  })
})

$('main').on('click', '.send-comment', (e) => {
  let $comment = $(e.currentTarget)

  $.post({
        url: `/post/comment`,
        dataType: 'json',
        data: {
          parentAuthor: $comment.data('parent'),
          parentPermlink: $comment.data('parent-permlink'),
          message: $('.comment-message').val(),
          parentTitle: $comment.data('parent-title')
        }
      }, (response) => {
          console.log(response)
          if (response.error) {
            $(`<span>${response.error.error_description}</span>`).insertAfter($comment)
            $(`<span>${response.author}</span>`).insertAfter($comment)
          } else {
            $(`<p>${response.msg}</p>`).insertAfter($comment)
          }
      })
})


$('.load-more-posts').on('click', (e) => {
  let filter = $('main').data('feed-type')
  let tag = $('main').data('tag') || ''
  getMoreContent(filter, tag)
})
