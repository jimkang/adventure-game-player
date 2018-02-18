include config.mk

PROJECTNAME = adventure-game-player
HOMEDIR = $(shell pwd)
SSHCMD = ssh $(USER)@$(SERVER)
PRIVSSHCMD = ssh $(PRIVUSER)@$(SERVER)
APPDIR = /opt/$(PROJECTNAME)

# pushall: sync set-permissions restart-remote
# 	git push origin master

pushall: sync
	git push origin master

sync:
	rsync -a $(HOMEDIR) $(USER)@$(SERVER):/opt/ \
		--exclude node_modules/ --exclude image-output/ --exclude data/
	$(SSHCMD) "cd $(APPDIR) && npm install"

set-permissions:
	$(SSHCMD) "chmod +x $(APPDIR)/$(PROJECTNAME)-responder.js"

check-log:
	$(SSHCMD) "journalctl -r -u $(PROJECTNAME)"

run-multiple:
	number=1 ; while [[ $$number -le 10 ]] ; do \
		node adventure-game-player-post.js --dry; \
		((number = number + 1)) ; \
	done

run-dry-on-server:
	$(SSHCMD) "cd $(APPDIR) && node adventure-game-player-post.js --dry"

run-on-server:
	$(SSHCMD) "cd $(APPDIR) && node adventure-game-player-post.js"

get-image-output-from-server:
	$(SSHCMD) "cd $(APPDIR) && tar zcvf image-output.tgz image-output/*"
	scp $(USER)@$(SERVER):$(APPDIR)/image-output.tgz server-image-output.tgz
	tar zxvf server-image-output.tgz

lint:
	./node_modules/.bin/eslint .

update-remote: sync set-permissions restart-remote

restart-remote:
	$(PRIVSSHCMD) "service $(PROJECTNAME) restart"

install-service:
	$(PRIVSSHCMD) "cp $(APPDIR)/$(PROJECTNAME).service /etc/systemd/system && \
	systemctl enable $(PROJECTNAME)"

stop-remote:
	$(PRIVSSHCMD) "service $(PROJECTNAME) stop"

check-status:
	$(SSHCMD) "systemctl status $(PROJECTNAME)"

make-data-dir:
	$(SSHCMD) "mkdir -p $(APPDIR)/data"

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
