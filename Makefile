include config.mk

PROJECTNAME = adventure-game-player
HOMEDIR = $(shell pwd)
SSHCMD = ssh $(USER)@$(SERVER)
PRIVSSHCMD = ssh $(PRIVUSER)@$(SERVER)
APPDIR = /opt/$(PROJECTNAME)

test:
	rm -f make-click-test.mp4
	rm -f pause-test.mp4
	node tests/make-click-movie-cmd-tests.js

pushall: sync
	git push origin master

sync:
	rsync -a $(HOMEDIR) $(USER)@$(SERVER):/opt/ \
		--exclude node_modules/ --exclude image-output/ --exclude data/
	$(SSHCMD) "cd $(APPDIR) && npm install"

prettier:
	prettier --single-quote --write "**/*.js"

# Static image to movie
bg-movie.mp4:
	ffmpeg -loop 1 -i tests/fixtures/background-a.png \
		-c:v libx264 -t 15 -pix_fmt yuv420p \
		bg-movie.mp4

try-compositing-not-moving: bg-movie.mp4
	rm -f output.mp4
	ffmpeg -i temp.mp4 -i static/basic-pointer.png \
		-filter_complex "[0:v][1:v] overlay=25:25:enable='between(t,0,20)'" \
		-pix_fmt yuv420p -c:a copy \
		output.mp4

try-compositing-moving: bg-movie.mp4
	rm -f output.mp4
	ffmpeg -i bg-movie.mp4 -i static/basic-pointer.png \
		-filter_complex "[0:v][1:v] \
		overlay=x='t*200:y=t*100':enable='between(t,0, 3)' [click1]; \
		[click1][1:v] overlay=x='3*200':y=400:enable='between(t,3.1,3.2)' [click2]; \
		[click2][1:v] overlay=x='3*200':y=400:enable='between(t,3.3,3.4)' [click3]; \
		[click3][1:v] overlay=x='3*200':y=400:enable='between(t,3.5,3.6)' [click4]; \
		[click4][1:v] overlay=x='3*200':y=400:enable='between(t,3.7,3.8)' [back]; \
		[back][1:v] overlay=x='200*(3 - (t - 3))':y=300:enable='between(t,4, 15)'" \
		-pix_fmt yuv420p -c:a copy \
		output.mp4

try-flashing: bg-movie.mp4
	rm -f output.mp4
	ffmpeg -i bg-movie.mp4 -i static/basic-pointer.png -i static/basic-pointer-negative.png \
		-filter_complex "[0:v] \
		overlay=x='t*200:y=t*100':enable='between(t,0, 3)' [flash1]; \
		[flash1][2:v] overlay=x='3*200':y=400:enable='between(t,3.0,3.1)' [click1]; \
		[click1][1:v] overlay=x='3*200':y=400:enable='between(t,3.1,3.2)' [flash2]; \
		[flash2][2:v] overlay=x='3*200':y=400:enable='between(t,3.2,3.3)' [click2]; \
		[click2][1:v] overlay=x='3*200':y=400:enable='between(t,3.3,3.4)' [flash3]; \
		[flash3][2:v] overlay=x='3*200':y=400:enable='between(t,3.4,3.5)' [click3]; \
		[click3][1:v] overlay=x='3*200':y=400:enable='between(t,3.5,3.6)' [flash4]; \
		[flash4][2:v] overlay=x='3*200':y=400:enable='between(t,3.6,3.7)' [click4]; \
		[click4][1:v] overlay=x='3*200':y=400:enable='between(t,3.7,3.8)' [flash5]; \
		[flash5][2:v] overlay=x='3*200':y=400:enable='between(t,3.8,3.9)' [back]; \
		[back][1:v] overlay=x='200*(3 - (t - 3))':y=300:enable='between(t,3.9, 15)'" \
		-pix_fmt yuv420p -c:a copy \
		output.mp4

try-compositing-one-movement: bg-movie.mp4
	rm -f output.mp4
	ffmpeg -i bg-movie.mp4 -i static/basic-pointer.png \
	-filter_complex "[0:v][1:v] \
	overlay=x=t*200:y=t*100:enable='between(t,0, 3)'" \
	-pix_fmt yuv420p -c:a copy \
		output.mp4

try-make-click-movie:
	rm -f make-click-test.mp4
	node tools/try-make-click-movie.js

try-make-click-movie-remote:
	# $(SSHCMD) "cd $(APPDIR) && rm -f make-click-test.mp4 &&  node tools/try-make-click-movie.js"
	scp $(USER)@$(SERVER):$(APPDIR)/make-click-test.mp4 remote-test.mp4

try-gvision:
	node tools/try-getting-image-targets.js tests/fixtures/surfaces/305286-hero-s-quest-so-you-want-to-be-a-hero-atari-st-screenshot.png
