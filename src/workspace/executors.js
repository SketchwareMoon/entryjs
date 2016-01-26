/*
 *
 */
"use strict";

goog.provide("Entry.Executor");

Entry.Executor = function(block, entity) {
    this.scope = new Entry.Scope(block, this);
    this.entity = entity;
    this._callStack = [];
};

(function(p) {
    p.execute = function() {
        while (true) {
            var returnVal = this.scope.block._schema.func.call(this.scope, this.entity, this.scope);
            if (returnVal === undefined || returnVal === null) {
                this.scope = new Entry.Scope(this.scope.block.next, this);
                if (this.scope.block === null) {
                    if (this._callStack.length)
                        this.scope = this._callStack.pop();
                    else
                        break;
                }
            } else if (returnVal === Entry.STATIC.CONTINUE) {
                break;
            }
        }
    };

    p.stepInto = function(thread) {
        if (!(thread instanceof Entry.Thread))
            console.error("Must step in to thread");

        this._callStack.push(this.scope);

        var block = thread.getFirstBlock();
        if (block.isDummy) block = block.next;

        this.scope = new Entry.Scope(block, this);
    };
})(Entry.Executor.prototype);

Entry.Scope = function(block, executor) {
    this.block = block;
    this.type = block ? block.type : null; //legacy
    this.executor = executor;
    this.entity = executor.entity;
};

(function(p) {
    p.callReturn = function() {
        return undefined;
    };

    p.getValue = function(key, block) {
        var fieldBlock = this.block.params[0]._data[1];
        var newScope = new Entry.Scope(fieldBlock, this.executor);
        var result = Entry.block[fieldBlock.type].func.call(newScope, this.entity, newScope);
        return result;
    };

    p.getStringValue = function(key, block) {
        return String(this.getValue(key, block));
    };

    p.getNumberValue = function(key, block) {
        return Number(this.getValue(key, block));
    };

    p.getBooleanValue = function(key, block) {
        return Number(this.getValue(key, block)) ? true : false;
    };

    p.getField = function() {
        return this.block.params[0];
    };

    p.getStringField = function() {
        return String(this.getField());
    };

    p.getNumberField = function() {
        return Number(this.getField());
    };

    p.getStatement = function(key) {
        this.executor.stepInto(this.block.statements[0]);
        return Entry.STATIC.CONTINUE;
    };
})(Entry.Scope.prototype);
