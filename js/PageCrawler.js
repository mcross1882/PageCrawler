(function($) {

  var PageCrawler = function() {
    this.successList = {};
    this.failList = {};
    this.pendingRequests = [];
  }
  
  PageCrawler.prototype.start = function() {
    var that = this;
    chrome.runtime.onMessage.addListener(function(res, sender, sendResponse) {
      console.log("PageCrawler", "Analyzing page...");
      if (res.action == 'analyze') {
        that.checkCSS();
        that.checkJavascript();
        that.checkLinks();
        that.checkImages();
      }
    });
  }
  
  PageCrawler.prototype.getResults = function() {
    return {
      passes: this.successList,
      fails: this.failList
    };
  }
  
  PageCrawler.prototype.checkLinks = function() {
    var href = false;
    var that = this;
    $('a').each(function() {
      href = $(this).attr('href');
      if (href && href != '#' && href.indexOf('mailto') < 0) {
        that.validateURL('links', $(this).attr('href'));
      }
    });
  }
  
  PageCrawler.prototype.checkJavascript = function() {
    var type = false;
    var that = this;
    $('script').each(function() {
      type = $(this).attr('type');
      if (type && type.indexOf('javascript') > -1 && $(this).attr('src')) {
        that.validateURL('javascript', $(this).attr('src'));
      }
    });
  }
  
  PageCrawler.prototype.checkCSS = function() {
    var type = false;
    var that = this;
    $('link').each(function() {
      type = $(this).attr('type');
      if (type && type.indexOf('css') > -1) {
        that.validateURL('css', $(this).attr('href'));
      }
    });
  }
  
  PageCrawler.prototype.checkImages = function() {
    var type = false;
    var that = this;
    $('img')
      .error(function(e) {
        that.onFail('images', $(this).attr('src'));
      })
      .each(function() {
        if ($(this).attr('src')) {
          that.validateURL('images', $(this).attr('src'));
        }
      });
  }
  
  PageCrawler.prototype.validateURL = function(type, url) {
    this.pendingRequests[url] = true;
    var that = this;
    $.get(url)
      .success(function(res) {
        that.onSuccess(type, url);
      })
      .fail(function(res) {
        // Javascript files have a tendency to produce
        // false positives do a sanity check
        if (res.status == 200 || res.status == 304) {
          that.onSuccess(type, url);
        } else {
          that.onFail(type, url);
        }
      });
  }
  
  PageCrawler.prototype.onSuccess = function(type, url) {
    if (!this.successList[type]) {
      this.successList[type] = [];
    }
    this.successList[type].push(url);
    this.removePendingRequest(url);
  }
  
  PageCrawler.prototype.onFail = function(type, url) {
    if (!this.failList[type]) {
      this.failList[type] = [];
    }
    this.failList[type].push(url);
    this.removePendingRequest(url);
  }
  
  PageCrawler.prototype.removePendingRequest = function(url) {
    delete this.pendingRequests[url];
    if (!this.hasPendingRequests()) {
      chrome.runtime.sendMessage({ action: 'finished', results: this.getResults() }, function(res) {
        console.log('Sent results to PopupController');
      });
    }
  }
  
  PageCrawler.prototype.hasPendingRequests = function() {
    var hasRequests = false;
    for (var i in this.pendingRequests) {
      hasRequests = true;
    }
    return hasRequests;
  }
  
  $(document).ready(function() {
    var crawler = new PageCrawler();
    crawler.start();
  });
  
})(window.jQuery);
