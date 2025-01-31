---
title: '#20 Build a Time Tracking App with Tkinter and Pygame'
description: 'Create a time tracking app with a GUI using Tkinter and Pygame in Python.'
publishDate: '31 January 2025'
updatedDate: '31 January 2025'
coverImage:
  src: './cover-tkinter.webp'
  alt: 'Time Tracking App with Tkinter and Pygame in Python'
tags: ['Pygame', 'Python', 'App']
---

## Building a Time Tracking App with Tkinter and Pygame in Python

Creating a graphical user interface (GUI) for a time tracking app in Python can be accomplished using various libraries. Two popular choices are Tkinter, which is widely used for standard applications, and Pygame, which is generally utilized for game development but can also be adapted for other types of interactive applications. This article provides a comprehensive guide on how to use both to create a functional time tracking application.

### Using Tkinter to Create a Time Tracking App

**Tkinter** is the standard GUI toolkit for Python. It provides a powerful object-oriented interface and is simple to learn and use.

#### Step 1: Setup

Before starting, make sure Python and Tkinter are installed. Tkinter is included with Python by default in most installations.

#### Step 2: Create the Main Window

Begin by importing Tkinter and setting up the main application window:

```python
import tkinter as tk
from tkinter import ttk

root = tk.Tk()
root.title("Time Tracker")
```

#### Step 3: Design the GUI

Add essential GUI components. For a time tracker, you need a display for the time and buttons to control it:

```python
timer_label = ttk.Label(root, text="00:00:00", font=("Segoe UI", 30))
timer_label.pack(pady=20)

start_button = ttk.Button(root, text="Start", command=lambda: start_timer())
start_button.pack(side=tk.LEFT, padx=20)

stop_button = ttk.Button(root, text="Stop", command=lambda: stop_timer())
stop_button.pack(side=tk.RIGHT, padx=20)
```

#### Step 4: Add Functionality

Define the functions that will start, stop, and update the timer:

```python
running = False
start_time = 0

def update_timer():
    if running:
        elapsed_time = time.time() - start_time
        minutes, seconds = divmod(int(elapsed_time), 60)
        hours, minutes = divmod(minutes, 60)
        timer_label.config(text=f"{hours:02}:{minutes:02}:{seconds:02}")
        root.after(1000, update_timer)

def start_timer():
    global running, start_time
    if not running:
        running = True
        start_time = time.time()
        update_timer()

def stop_timer():
    global running, start_time
    running = False
    start_time = 0
    timer_label.config(text="00:00:00")
```

#### Step 5: Main Loop

Keep the window open and responsive:

```python
root.mainloop()
```

### Using Pygame as an Alternative

**Pygame** offers more flexibility in terms of graphics and animations, making it a viable alternative for building a time tracking app, especially if you want custom visuals.

#### Step 1: Install and Import Pygame

Ensure Pygame is installed using pip (\`pip install pygame\`) and then import it:

```python
import pygame
import sys
from pygame.locals import *
import time
```

#### Step 2: Initialize Pygame

Set up the main display and clock:

```python
pygame.init()
fps_clock = pygame.time.Clock()

width, height = 400, 200
screen = pygame.display.set_mode((width, height))
pygame.display.set_caption('Time Tracker')
```

#### Step 3: Setup Display and Fonts

Define your display parameters and fonts:

```python
black = (0, 0, 0)
white = (255, 255, 255)
font = pygame.font.Font(None, 36)
```

#### Step 4: Timer Logic

Initialize timer variables and define the timer functions similar to Tkinter:

```python
start_time = None
elapsed_time = 0
running = False

def start_timer():
    global running, start_time
    if not running:
        running = True
        start_time = time.time() - elapsed_time

def stop_timer():
    global running, elapsed_time
    if running:
        running = False
        elapsed_time = time.time() - start_time
```

#### Step 5: Main Event Loop

Create the loop to handle events and update the display:

```python
while True:
    screen.fill(black)
    for event in pygame.event.get():
        if event.type == QUIT:
            pygame.quit()
            sys.exit()
        elif event.type == KEYDOWN:
            if event.key == K_s:
                start_timer()
            elif event.key == K_p:
                stop_timer()

    if running:
        current_time = time.time()
        elapsed_time = current_time - start_time
        mins, secs = divmod(elapsed_time, 60)
        hrs, mins = divmod(mins, 60)
        time_string = "%d:%02d:%02d" % (hrs, mins, secs)
    else:
        mins, secs = divmod(elapsed_time, 60)
        hrs, mins = divmod(mins, 60)
        time_string = "%d:%02d:%02d" % (hrs, mins, secs)

    time_text = font.render(time_string, True, white)
    time_rect = time_text.get_rect()
    time_rect.center = (width // 2, height // 2)
    screen.blit(time_text, time_rect)

    pygame.display.update()
    fps_clock.tick(fps)
```

### Conclusion

In summary, both Tkinter and Pygame provide robust frameworks for developing a time tracking application with graphical user interfaces in Python. While Tkinter is more straightforward and suitable for typical application interfaces, Pygame offers enhanced control over graphic elements and animations, which can be particularly beneficial for applications requiring dynamic visual displays. The selection between these two should be based on the specific requirements and objectives of the project, as well as the developer's familiarity with the libraries.
