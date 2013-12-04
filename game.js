// GLOBALS
var CANVAS_W     = 350,
    CANVAS_H     = 500,
    canvas       = document.getElementById('invaders'),
    ctx          = canvas.getContext('2d'),
    heroBullets  = [],
    enemyBullets = [],
    enemies      = [],
    heroDead     = false,
    loopInterval = null;

// set up the canvas    
canvas.width  = CANVAS_W;
canvas.height = CANVAS_H;

/* 
 * Invaders class
 * primary class for our Invaders game
 */
var Invaders = function() {
    var invaders = this;
    
    invaders.fps         = 20;
    invaders.enemyCount  = 0;
    invaders.enemyStartX = 0;
    invaders.enemyStartY = 0;
    invaders.hero = new Hero();
    
    // constructor
    invaders.init = function(action) {
        canvas.removeEventListener('click', invaders.init, false);
        heroDead = heroDead ? !heroDead : heroDead;
        
        invaders.enemyCount   = 40;
        invaders.enemyStartX  = 10;
        invaders.enemyStartY  = 1;
        invaders.hero.actions();
        
        // create new enemies
        for (var i=1; i < invaders.enemyCount + 1; i++) {
            enemies.push(new Enemy({x: invaders.enemyStartX, y: invaders.enemyStartY}));
            invaders.enemyStartX += 35;
            if (i % 10 == 0) {
                invaders.enemyStartX = 10;
                invaders.enemyStartY += 35;
            }
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 24px courier';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText('Click to start!', canvas.width / 2, canvas.height / 2);
        
        invaders.hero.draw();
        
        canvas.addEventListener('click', invaders.gameLoop, false);
    };
    
    // Box collision detection
    invaders.collide = function(a, b) {
        return a.xPos < b.xPos + b.w &&
            a.xPos + a.w > b.xPos &&
            a.yPos < b.yPos + b.h &&
            a.yPos + a.h > b.yPos;    
    };
    
    invaders.enemyShot = function() {
        heroBullets.forEach(function(heroBullet) {
            enemies.forEach(function(enemy) {
                if (invaders.collide(heroBullet, enemy)) {
                    enemy.kill();
                    heroBullet.active = false;
                }
            });    
        });    
    };
    
    invaders.heroShot = function() {
        enemyBullets.forEach(function(enemyBullet) {
            if (invaders.collide(enemyBullet, invaders.hero)) {
                invaders.hero.die();
            }
        });    
    };
    
    // game over stuff
    invaders.gameOver = function(winLose) {
        clearTimeout(loopInterval);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 24px courier';
        ctx.textAlign = 'center';
        
        if (winLose === 'win') {
            ctx.fillStyle = '#99FF99';
            ctx.fillText('You Win!', canvas.width / 2, canvas.height / 2);    
        } 
        if (winLose === 'lose') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('You Died', canvas.width / 2, canvas.height / 2);
        }
        
        ctx.font = 'bold 18px courier';
        ctx.textAlign = 'center';
        ctx.fillText('Click to start over', canvas.width / 2, (canvas.height / 2) + 40);
        
        canvas.addEventListener('click', invaders.init, false);
    };
    
    // The main game loop!
    invaders.gameLoop = function() {
        canvas.removeEventListener('click', invaders.gameLoop, false);
        
        loopInterval = setTimeout(invaders.gameLoop, 1000/invaders.fps);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        invaders.hero.draw();
        invaders.enemyShot();
        invaders.heroShot();
        
        // update bullet positions
        heroBullets.forEach(function(bullet) {
            bullet.update('hero');
        });
        
        // filter out bullets that are out of bounds
        heroBullets = heroBullets.filter(function(bullet) {
            return bullet.active; 
        });
        
        // update enemy positions
        enemies.forEach(function(enemy) {
            enemy.update();    
        });
        
        // filter out dead enemies
        enemies = enemies.filter(function(enemy) {
            return enemy.active;
        });
        
        // pick a random enemy to shoot
        if (enemyBullets.length < 2) {
            enemies[Math.ceil(Math.random() * ((enemies.length - 1) - 0) + 0)].shoot();    
        }
        
        // update enemy bullets
        enemyBullets.forEach(function(bullet) {
            bullet.update('enemy');    
        });
        
        // filter out enemy bullets that are out of bounds
        enemyBullets = enemyBullets.filter(function(bullet) {
            return bullet.active;    
        });
        
        // check if all enemies are dead
        if (enemies.length == 0) {
            invaders.gameOver('win');
        }
        
        if (heroDead) {
            invaders.gameOver('lose');
        }
    };
    
    invaders.init();
};

/*
 * Hero class
 * class for our hero object
 */
var Hero = function() {
    var hero = this;
    
    // Hero class properties
    hero.xPos = (CANVAS_W / 2) - 12.5;
    hero.yPos = CANVAS_H - 50;
    hero.w    = 20;
    hero.h    = 20;
    hero.inc  = 20;
    
    // draws our hero on the canvas
    hero.draw = function(status) {
        var color = status === 'dead' ? 'red' : '#33CCFF';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.rect(hero.xPos, hero.yPos, hero.w, hero.h);
        ctx.rect(hero.xPos + 20, hero.yPos + 10, 10, 10);
        ctx.rect(hero.xPos - 10, hero.yPos + 10, 10,  10);
        ctx.closePath();
        ctx.fill();
    };
    
    // Listeners for keypress movement
    hero.actions = function() {
        window.onkeydown = function(e) {
            if (e.keyCode == 39) {                
                if (hero.xPos < (CANVAS_W - 30)) {
                    hero.xPos = hero.xPos + hero.inc;
                }
            }
            
            if (e.keyCode == 37) {                
                if (hero.xPos > 12.5) {
                    hero.xPos = hero.xPos - hero.inc;    
                }                
            }
            
            if (e.keyCode == 32) {
                hero.shoot();
            }
        };
    };
    
    // firing bullets from our hero
    hero.shoot = function() {
        heroBullets.push(new Bullet({x: hero.xPos + 8, y: hero.yPos - 20, src: 'hero'}));
    }
    
    // the hero dies :(
    hero.die = function() {        
        heroDead = true;
    };
};

/* Bullet class
 * class for the bullet object
 */
var Bullet = function(B) {
    var bullet = this;
    
    // Bullet properties
    bullet.xPos   = B.x;
    bullet.yPos   = B.y;
    bullet.w      = 5;
    bullet.h      = 5;
    bullet.inc    = 20;
    bullet.active = true;
    
    // draw the bullet
    bullet.draw = function(x, y) {
        var color = B.src === 'hero' ? '#FFFF00' : '#FFCC00';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.rect(x, y, bullet.w, bullet.h);
        ctx.closePath();
        ctx.fill();
    };
    
    // check to see if bullet is in bounds
    bullet.inBounds = function() {
        return bullet.yPos > 0 && bullet.yPos < CANVAS_H;    
    };
    
    // update the bullet position
    bullet.update = function(source) {
        if (source === 'hero') {
            bullet.yPos -= bullet.inc;    
        } 
        if (source === 'enemy') {
            bullet.yPos += bullet.inc;
        }
        
        bullet.draw(bullet.xPos, bullet.yPos);
        bullet.active = bullet.active && bullet.inBounds();
    };    
};

/* Enemy Class
 * class for the enemy object
 */
var Enemy = function(E) {
    var enemy = this;
    
    // Enemy properties
    enemy.xPos   = E.x;
    enemy.yPos   = E.y;
    enemy.w      = 15;
    enemy.h      = 15;
    enemy.active = true;
    
    enemy.draw = function(x, y) {
       ctx.fillStyle = '#78E678';
       ctx.beginPath();
       ctx.rect(x, y, enemy.w, enemy.h);
       ctx.rect(x + 15, y + 12, 5, 5);
       ctx.rect(x - 5, y + 12, 5, 5);       
       ctx.closePath();
       ctx.fill();
    };
    
    enemy.update = function() {
        enemy.draw(enemy.xPos, enemy.yPos);
    };
    
    enemy.shoot = function() {
        enemyBullets.push(new Bullet({x: enemy.xPos + 8, y: enemy.yPos - 20, src: 'enemy'}));    
    };
    
    enemy.kill = function() {
        enemy.active = false;
    };
};

var Invade = new Invaders();