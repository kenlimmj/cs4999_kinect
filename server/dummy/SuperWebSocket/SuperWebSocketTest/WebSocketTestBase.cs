﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading;
using NUnit.Framework;
using SuperSocket.Common;
using SuperSocket.SocketBase;
using SuperSocket.SocketBase.Config;
using SuperSocket.SocketBase.Logging;
using SuperSocket.SocketEngine;
using SuperWebSocket;
using SuperWebSocket.SubProtocol;
using WebSocket4Net;

namespace SuperWebSocketTest
{
    public abstract class WebSocketTestBase
    {
        protected WebSocketServer WebSocketServer { get; private set; }

        protected AutoResetEvent MessageReceiveEvent = new AutoResetEvent(false);
        protected AutoResetEvent DataReceiveEvent = new AutoResetEvent(false);
        protected AutoResetEvent OpenedEvent = new AutoResetEvent(false);
        protected AutoResetEvent CloseEvent = new AutoResetEvent(false);
        protected string CurrentMessage { get; private set; }
        protected byte[] CurrentData { get; private set; }

        public WebSocketTestBase()
        {

        }

        protected void Setup(WebSocketServer websocketServer, Action<ServerConfig> configurator)
        {
            var rootConfig = new RootConfig { DisablePerformanceDataCollector = true };

            websocketServer.NewDataReceived += new SessionHandler<WebSocketSession, byte[]>(WebSocketServer_NewDataReceived);

            var config = new ServerConfig();
            configurator(config);

            var ret = websocketServer.Setup(rootConfig, config, null, null, new ConsoleLogFactory(), null, null);

            Assert.IsTrue(ret);

            WebSocketServer = websocketServer;
        }

        [TestFixtureSetUp]
        public virtual void Setup()
        {
            Setup(new WebSocketServer(), c => 
                {
                    c.Port = 2012;
                    c.Ip = "Any";
                    c.MaxConnectionNumber = 100;
                    c.MaxRequestLength = 100000;
                    c.Name = "SuperWebSocket Server";
                });

            WebSocketServer.NewMessageReceived += new SessionHandler<WebSocketSession, string>(WebSocketServer_NewMessageReceived);
        }

        protected void WebSocketServer_NewMessageReceived(WebSocketSession session, string e)
        {
            session.Send(e);
        }

        protected void WebSocketServer_NewDataReceived(WebSocketSession session, byte[] e)
        {
            session.Send(e, 0, e.Length);
        }

        [SetUp]
        public void StartServer()
        {
            WebSocketServer.Start();
        }

        [TearDown]
        public void StopServer()
        {
            WebSocketServer.Stop();
        }

        protected WebSocket CreateClient()
        {
            return CreateClient(WebSocketVersion.Rfc6455, true);
        }

        protected WebSocket CreateClient(WebSocketVersion version)
        {
            return CreateClient(version, true);
        }

        protected WebSocket CreateClient(WebSocketVersion version, bool autoConnect)
        {
            var webSocketClient = new WebSocket(string.Format("ws://127.0.0.1:{0}/websocket", WebSocketServer.Config.Port), "basic", version);
            webSocketClient.Opened += new EventHandler(webSocketClient_Opened);
            webSocketClient.Closed += new EventHandler(webSocketClient_Closed);
            webSocketClient.DataReceived += new EventHandler<DataReceivedEventArgs>(webSocketClient_DataReceived);
            webSocketClient.MessageReceived += new EventHandler<MessageReceivedEventArgs>(webSocketClient_MessageReceived);

            if (autoConnect)
            {
                webSocketClient.Open();

                if (!OpenedEvent.WaitOne(1000))
                    Assert.Fail("Failed to open");
            }
            
            return webSocketClient;
        }

        void webSocketClient_MessageReceived(object sender, MessageReceivedEventArgs e)
        {
            CurrentMessage = e.Message;
            MessageReceiveEvent.Set();
        }

        void webSocketClient_DataReceived(object sender, DataReceivedEventArgs e)
        {
            CurrentData = e.Data;
            DataReceiveEvent.Set();
        }

        void webSocketClient_Closed(object sender, EventArgs e)
        {
            CloseEvent.Set();
        }

        void webSocketClient_Opened(object sender, EventArgs e)
        {
            OpenedEvent.Set();
        }
    }
}
