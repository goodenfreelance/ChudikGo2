package ws

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"creatures-server/game"
)

type Hub struct {
	mu         sync.RWMutex
	clients    map[string]*Client
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	room       *game.Room
}

func NewHub(room *game.Room) *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		broadcast:  make(chan []byte, 1024),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		room:       room,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.playerID] = client
			h.mu.Unlock()
			log.Printf("Player connected: %s (Total clients: %d)", client.playerID, len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.playerID]; ok {
				delete(h.clients, client.playerID)
				close(client.send)
				h.room.RemovePlayer(client.playerID)
				log.Printf("Player disconnected: %s", client.playerID)
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for _, client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client.playerID)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) handleMessage(client *Client, msg game.WSInputMessage) {
	switch msg.Type {
	case "join":
		c := h.room.AddPlayer(client.playerID, msg.Name, msg.Color, msg.Elements, msg.PresetIndex, msg.TargetX, msg.TargetY, msg.TargetAngleDeg)
		initMsg := game.WSOutputMessage{
			Type:        "init",
			YourID:      c.ID,
			WorldRadius: 60.0,
		}
		data, _ := json.Marshal(initMsg)
		client.send <- data

	case "input":
		h.room.HandleInput(client.playerID, msg)

	case "spawn_food":
		if msg.FoodX != nil && msg.FoodY != nil {
			fType := msg.FoodType
			if fType == "" {
				fType = game.FoodBerry
			}
			h.room.AddFoodAt(*msg.FoodX, *msg.FoodY, fType)
		}

	case "chat":
		if msg.ChatMessage != "" {
			chatMsg := game.WSOutputMessage{
				Type:          "chat",
				ChatSender:    msg.Name,
				ChatMessage:   msg.ChatMessage,
				ChatColor:     msg.Color,
				ChatTimestamp: time.Now().Format("15:04:05"),
			}
			data, _ := json.Marshal(chatMsg)
			h.broadcast <- data
		}

	case "ping":
		pongMsg := game.WSOutputMessage{
			Type:       "pong",
			ClientTime: msg.ClientTime,
			ServerTime: time.Now().UnixMilli(),
		}
		data, _ := json.Marshal(pongMsg)
		client.send <- data
	}
}

func (h *Hub) BroadcastRoomState(msg game.WSOutputMessage, targetPlayerID string) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}

	if targetPlayerID != "" {
		h.mu.RLock()
		if client, ok := h.clients[targetPlayerID]; ok {
			select {
			case client.send <- data:
			default:
			}
		}
		h.mu.RUnlock()
	} else {
		select {
		case h.broadcast <- data:
		default:
		}
	}
}
