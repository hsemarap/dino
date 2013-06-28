var fbApp = {
	init: function(accessToken) {
		this.accessToken = accessToken;
		this.posts = [];
		this.queue = [];
		this.fetchUserData().then(this.initUser.bind(this));
		this.prevPost = null;
		this.date_start = date_start;
		this.date_end = date_end;
	},
	fetchUserData: function() {
		var self = this,
			def = $.Deferred();
		$.get('https://graph.facebook.com/me?fields=name,username&access_token='+this.accessToken,
			function(response) {
				$.each(response,function(key,value) {
					self[key] = value;
				});
				def.resolve();
			}, "json")
		.error(function(ajaxObj) {
			alert("Unknown error while fetching userdata");
			console.error(ajaxObj.response);
		});
		return def;
	},
	initUser: function() {
		this.fetchMoreURL = 'https://graph.facebook.com/'+this.username+'/feed?access_token='+this.accessToken+'&since='+this.date_start+'&until='+this.date_end;
		console.log(this.fetchMoreURL);
	},
	getMorePosts: function() {
		var self = this,
			postlist = $("#postlist")[0];
		$.get(this.fetchMoreURL,
			function(response) {
				$.each(response.data,function(index,postdata) {
					if(!self.prevPost) self.prevPost = postdata.id;
					var post = new Post(postdata);
					postlist.appendChild(post.getHTMLNode());
					self.posts.push(post);
				});
				self.fetchMoreURL = response.paging.next;
			},"json")
		.error(function(ajaxObj) {
			var e = ajaxObj.responseJSON;
			if(e&&e.error&&e.error.type&&e.error.type==="OAuthException") {
				gotoAuthPage();
			} else {
				alert("Unknown error, we are working on fixing it, please be patient");
				console.error(ajaxObj.response);
			}   
		}); 
	},
	selectAll: function() {
		$.each(this.posts,function(index,post) {
			post.check();
		});
	},
	selectNone: function() {
		$.each(this.posts,function(index,post) {
			post.uncheck();
		});
	},
	invertSelection: function() {
		$.each(this.posts,function(index,post) {
			if(post.isChecked()) post.uncheck();
			else post.check();
		});
	},
	onPostSelected: function(postId,shift) {
		if(shift) {
			var shouldSelect = false,
				self = this;
			$.each(this.posts,function(index,post) {
				if(post.id === self.prevPost || post.id === postId) shouldSelect = !shouldSelect;
				if(shouldSelect&&!post.isChecked()) post.toggle();
			});
		} else {
			this.prevPost = postId;
		}
	},
	likeAndComment: function() {
		var shouldLike = !!$("#likeCheckbox").is(':checked'),
			shouldComment = $("#commentCheckbox").is(':checked'),
			comment = $("#commentBox").val(),
			self = this;

		$.each(this.posts,function(index,post) {
			if(post.isChecked()) {
				if(shouldLike&&!post.isLiked(self.name)) self.like(post.id);
				if(shouldComment&&!post.isCommented(self.name,comment)) self.comment(post.id,comment);
			}
		});
		$.when.apply({},this.queue).done(function() {
			self.queue = [];
			self.selectNone();
			alert("Done");
		});
	},
	like: function(postId) {
		this.queue.push($.get("https://graph.facebook.com/"+postId+"/likes?method=POST&format=json&access_token="+this.accessToken));
	},
	comment: function(postId,comment) {
		var comment = encodeURIComponent(comment);
		this.queue.push($.get("https://graph.facebook.com/"+postId+"/comments?method=POST&message="+comment+"&format=json&access_token="+this.accessToken));
	},
	removeMyPosts: function() {
		var self = this,
			newposts = [];
		$.each(this.posts,function(index,post) {
			if(post.getAuthor() === self.name) post.remove();
			else newposts.push(post);
		});
		this.posts = newposts;
	},
	updateValues: function(date_start, date_end) {
		this.date_start = date_start;
		this.date_end = date_end;
		this.initUser();
	}
}
