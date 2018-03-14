import React, { Component } from 'react';
import { BOUNTIES_BASE_URL, limitStr, timeDifference } from '../utils/utils';
import { DEVELOPMENT } from '../constants';

const bountyStyle = {
  float: 'right'
};

const searchBtnStyle = {
  marginLeft: '25px'
};

const bountyImgStyle = {
  height: '20px',
  width: '20px'
};

const ENTER_KEY = 13;

function BountyItem({item}) {
  return (
    <tr>
      <td><img src={item.imgsrc} alt='' style={bountyImgStyle} /></td>
      <td>{item.timeDiff}</td>
      <td>{item.tokenName}</td>
      <td>{item.title}</td>
      <td>{item.tokenName}</td>
      <td>{item.state}</td>
      <td><a href={item.linkUrl} target= '_blank' className='target' rel='noopener noreferrer'>'View >></a></td>
    </tr>
  )
}

function TableNodes({bounties, loading}) {
  if (loading) {
    return (
      <tbody>
        <tr>
          <td col='4'>Loading...</td>
        </tr>
      </tbody>
    );
  }
  if (bounties.length === 0) {
    return (
      <tbody>
        <tr>
          <td col='4'>No Bounties Found</td>
        </tr>
      </tbody>
    );
  }

  var max_display = 10;
  var lines = [];
  for(var i=0; i < bounties.length && i < max_display; i++) {
    let bounty = bounties[i];
    let item = {
      imgsrc: bounty['avatar_url'],
      timeDiff: timeDifference(new Date(), new Date(bounty['web3_created'])),
      tokenName: Math.round(100.0 * bounty['value_in_token'] / 10 ** 18) / 100 + ' ' + bounty['token_name'],
      title: limitStr(bounty['title'], 30),
      state: limitStr(bounty['status'],30),
      linkUrl: bounty['github_url']
    }
    lines.push(item);
  }

  return (
    <tbody>
      {lines.map(item => (<BountyItem item={item} key={item.title}/>))}
    </tbody>
  )
}

export class History extends Component {
  constructor() {
    super();
    this.state = {
      bounties: [],
      browserLocation: null,
      githubUsername: null,
      keyword: '',
      loading: true,
      fetchError: null
    }
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentDidMount() {
    let url = localStorage['browser_location'];
    let keyword = localStorage['keyword'];
    let isOnGitHubcom = typeof url !== 'undefined' && url.indexOf('://github.com') !== -1 && url.indexOf('://github.com') < 15;
    let isOnRepo = typeof url !== 'undefined' && isOnGitHubcom && url.match(/.+\/.+\/.+\/.+\/?/gi) != null;

    if (isOnGitHubcom && isOnRepo) {
      var repo = url.split('/')[4];
      this.searchBounties(repo);
    }

    if (keyword) {
      this.setState({keyword});
      this.searchBounties(keyword);
    }

    if(localStorage['githubusername']) {
      this.setState({
        githubUsername: localStorage['githubusername'],
        browserLocation: url
    });
    }

    let fetchUrl = DEVELOPMENT ? '/mock.json' :
      BOUNTIES_BASE_URL + 'idx_status=open&order_by=-web3_created';
    fetch(fetchUrl)
      .then(res => res.json())
      .then(data => {
        this.setState({
          bounties: data,
          loading: false
        });
      })
      .catch((e) => {
        this.setState({fetchError: 'Error: Could not reach api: ' + e});
      });
  }

  handleClick(e) {
    e.preventDefault();
    switch(e.target.id) {
      case 'search-button':
        let { keyword } = this.state;
        this.searchBounties(keyword);
        break;
    }
  }

  handleChange(e) {
    this.setState({keyword: e.target.value});
  }

  handleKeyDown(e) {
    if (e.keyCode === ENTER_KEY) {
      let { keyword } = this.state
      this.searchBounties(keyword);
    }
  }

  searchBounties(keyword) {
    keyword = keyword.toLowerCase();
    var matching_bounties = [];
    var all_bounties = this.state.bounties;
    for (var i = all_bounties.length - 1; i >= 0; i--) {
      var bounty_keywords = all_bounties[i].metadata.issueKeywords.toLowerCase();
      var bounty_title = all_bounties[i].title.toLowerCase();
      var do_keywords_contain = bounty_keywords.indexOf(keyword) !== -1;
      var does_title_contain = bounty_title.indexOf(keyword) !== -1;
      if (do_keywords_contain || does_title_contain) {
        matching_bounties.push(all_bounties[i]);
        localStorage.setItem('keyword', keyword);
      }
    }
    this.setState({
      bounties: matching_bounties,
      keyword,
      loading: false
    });
  }

  render() {
    let href = this.state.githubusername ? `https://gitcoin.co/funding/new?&user=${this.state.githubUsername}&source=${this.state.browserLocation}` : 'https://gitcoin.co/funding/new';
    return this.state.fetchError ? (<span>{this.state.fetchError}</span>) : (
      <div id='history'>
        <div id='bounty' style={bountyStyle}>
            <a target='_blank' href={href} rel='noopener noreferrer' className='btn btn-sm btn-primary js-details-target gitcoin_button'>+ Fund Issue</a>
        </div>
        <h5>Funded Issues</h5>
        <input type='text' id='search_bar' value={this.state.keyword} placeholder='Search for keywords..' onChange={this.handleChange} onKeyDown={this.handleKeyDown} />
        <button id="search-button" style={searchBtnStyle} onClick={this.handleClick} className='btn btn-sm btn-primary js-details-target gitcoin_button'>Search</button>
        <table className='table table-striped' id='openbounties'>
          <thead>
            <tr>
              <th></th>
              <th>When</th>
              <th>Amount</th>
              <th>For</th>
              <th>Status</th>
              <th>Link</th>
            </tr>
          </thead>
          <TableNodes {...this.state} />
        </table>
        <a target='new' href='https://gitcoin.co/explorer' rel='noopener noreferrer'>View More &gt;&gt; </a>
      </div>
    );
  }
}

export default History;
