#!/bin/sh


# Global Variable
PID=-1


# Exported Variables
export NODEJS=""
export ZCAT=""
export CB_TOP_DIR="$(cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd)"
export CB_INCLUDE="$CB_TOP_DIR/include"
export CB_SCRIPTS="$CB_TOP_DIR/scripts"
export CB_SERVER="$CB_TOP_DIR/$(find server -maxdepth 1 -name cb-server.js)"
export CB_LOG="/tmp/codeboot.log"
export CB_FEEDBACKS="$CB_TOP_DIR/feedbacks"
export CB_PORT=8080



# Options
VERBOSE=0
START=0
DAEMON=0
KILL=0
LOG=0

usage() {
    echo "$(basename "%$0") [-h] [-v] [-s] [-d] [-k] [-l] [-p] -- Manage CodeBoot Server

    Usage:
    	-h Show this help message
	-v Explain what is being done
	-s Start server
	-d Run server as daemon
	-l Run the server with log
	-k Kill an existing server"
    exit 0
}

while getopts ":hvsdlkp:" option; do
    case $option in
	h) usage
	   ;;
	v) VERBOSE=1
	   ;;
	s) START=1
	   ;;
	d) DAEMON=1
	   ;;
	l) LOG=1
	   ;;
	p) CB_PORT=${OPTARG}
	   ;;
	k) KILL=1
	   ;;
    esac
done


start_server() {

    init_feedback

    if [ $PID -ne -1 ]; then

	prompt_for_restart

	if [ $? -ne 0 ]; then
	    exit 1
	fi

	return 0
    fi

    verbose "Starting server"

    lookup_nodejs
    if [ $? -ne 0 ]; then
	echo >&2 "Can not find NodeJS"
	exit 1
    fi

    find_zcat
    if [ $? -ne 0 ]; then
	echo >&2 "Can not find zcat"
	exit 1
    fi

    if [ $DAEMON -eq 1 ]; then
	run_daemon
    else
	verbose "Server Started"
	$NODEJS $CB_SERVER
    fi

    return 0
}


run_daemon() {
    verbose "Running Server as Daemon"
    nohup $NODEJS $CB_SERVER > /dev/null 2>&1 &
}

restart_server() {

    kill -USR1 "$PID"
}

lookup_nodejs() {

    verbose "Looking up for NodeJS"

    NODEJS=$(which node 2> /dev/null)
    if [ $? -ne 0 ]; then
	NODEJS=$(which nodejs 2> /dev/null)

	return $?
    fi

    return 0
}

find_zcat() {

    ZCAT=$(which zcat 2> /dev/null) 
    if [ $? -ne 0 ]; then
	ZCAT=$(which gzcat 2> /dev/null)

	return $?
    fi

    return 0
}



prompt_for_restart() {
    echo "Server already started with PID $PID."
    while true; do
	read -p "Do you want to restart the server? [y/n] " yn
	case $yn in
	    [Yy]* ) restart_server;
		    return 0
		    ;;
	    [Nn]* ) return 1
		    ;;
	    *) echo "Invalide choice"
	esac
    done
}

verbose() {

    if [ $VERBOSE -eq 1 ]; then
	echo $1
    fi
}

lookup_pid() {

    tmp="$(pgrep -lf $CB_SERVER)"

    if [ $? -eq 0 ]; then
	PID="$(echo $tmp | awk '{print $1}')"
    fi
}

init_log() {
    mkdir -p "$CB_TOP_DIR/log"
    CB_LOG="$CB_TOP_DIR/log/codeboot.log"
}

init_feedback() {
    mkdir -p "$CB_FEEDBACKS"
}


main() {

    lookup_pid

    if [ $KILL -eq 1 ]; then
	verbose "Killing Server at PID $PID"
	kill -KILL $PID
	PID=-1
    fi

    if [ $LOG -eq 1 ]; then
	init_log
    fi

    if [ $START -eq 1 ]; then
	start_server
    fi

    exit 0
}

main
