#!/usr/bin/env python
##################################################
# Gnuradio Python Flow Graph
# Title: Fft Over Tcp
# Generated: Sat Nov 21 10:40:38 2015
##################################################

from gnuradio import blocks
from gnuradio import eng_notation
from gnuradio import fft
from gnuradio import gr
from gnuradio import wxgui
from gnuradio.eng_option import eng_option
from gnuradio.fft import window
from gnuradio.filter import firdes
from gnuradio.wxgui import fftsink2
from gnuradio.wxgui import waterfallsink2
from grc_gnuradio import blks2 as grc_blks2
from grc_gnuradio import wxgui as grc_wxgui
from optparse import OptionParser
import SimpleXMLRPCServer
import osmosdr
import threading
import time
import wx

class fft_over_tcp(grc_wxgui.top_block_gui):

    def __init__(self):
        grc_wxgui.top_block_gui.__init__(self, title="Fft Over Tcp")

        ##################################################
        # Variables
        ##################################################
        self.veclen = veclen = 8192
        self.test = test = 1420e6
        self.samp_rate = samp_rate = 1500000

        ##################################################
        # Blocks
        ##################################################
        self.xmlrpc_server_0 = SimpleXMLRPCServer.SimpleXMLRPCServer(("localhost", 8080), allow_none=True)
        self.xmlrpc_server_0.register_instance(self)
        threading.Thread(target=self.xmlrpc_server_0.serve_forever).start()
        self.wxgui_waterfallsink2_0 = waterfallsink2.waterfall_sink_c(
        	self.GetWin(),
        	baseband_freq=1420e6,
        	dynamic_range=100,
        	ref_level=0,
        	ref_scale=2.0,
        	sample_rate=samp_rate,
        	fft_size=veclen,
        	fft_rate=15,
        	average=False,
        	avg_alpha=None,
        	title="Waterfall Plot",
        )
        self.Add(self.wxgui_waterfallsink2_0.win)
        self.wxgui_fftsink2_1 = fftsink2.fft_sink_c(
        	self.GetWin(),
        	baseband_freq=test,
        	y_per_div=10,
        	y_divs=10,
        	ref_level=0,
        	ref_scale=2.0,
        	sample_rate=samp_rate,
        	fft_size=veclen,
        	fft_rate=8,
        	average=False,
        	avg_alpha=None,
        	title="FFT Plot",
        	peak_hold=False,
        )
        self.Add(self.wxgui_fftsink2_1.win)
        self.rtlsdr_source_0 = osmosdr.source( args="numchan=" + str(1) + " " + "" )
        self.rtlsdr_source_0.set_sample_rate(samp_rate)
        self.rtlsdr_source_0.set_center_freq(test, 0)
        self.rtlsdr_source_0.set_freq_corr(0, 0)
        self.rtlsdr_source_0.set_dc_offset_mode(0, 0)
        self.rtlsdr_source_0.set_iq_balance_mode(0, 0)
        self.rtlsdr_source_0.set_gain_mode(False, 0)
        self.rtlsdr_source_0.set_gain(1, 0)
        self.rtlsdr_source_0.set_if_gain(1, 0)
        self.rtlsdr_source_0.set_bb_gain(1, 0)
        self.rtlsdr_source_0.set_antenna("", 0)
        self.rtlsdr_source_0.set_bandwidth(0, 0)
          
        self.fft_vxx_0 = fft.fft_vcc(veclen, True, (window.blackmanharris(veclen)), True, 1)
        self.blocks_stream_to_vector_0 = blocks.stream_to_vector(gr.sizeof_gr_complex*1, veclen)
        self.blocks_complex_to_mag_0 = blocks.complex_to_mag(veclen)
        self.blks2_tcp_sink_0 = grc_blks2.tcp_sink(
        	itemsize=gr.sizeof_float*veclen,
        	addr="127.0.0.1",
        	port=10001,
        	server=True,
        )

        ##################################################
        # Connections
        ##################################################
        self.connect((self.blocks_complex_to_mag_0, 0), (self.blks2_tcp_sink_0, 0))    
        self.connect((self.blocks_stream_to_vector_0, 0), (self.fft_vxx_0, 0))    
        self.connect((self.fft_vxx_0, 0), (self.blocks_complex_to_mag_0, 0))    
        self.connect((self.rtlsdr_source_0, 0), (self.blocks_stream_to_vector_0, 0))    
        self.connect((self.rtlsdr_source_0, 0), (self.wxgui_fftsink2_1, 0))    
        self.connect((self.rtlsdr_source_0, 0), (self.wxgui_waterfallsink2_0, 0))    


    def get_veclen(self):
        return self.veclen

    def set_veclen(self, veclen):
        self.veclen = veclen

    def get_test(self):
        return self.test

    def set_test(self, test):
        self.test = test
        self.rtlsdr_source_0.set_center_freq(self.test, 0)
        self.wxgui_fftsink2_1.set_baseband_freq(self.test)

    def get_samp_rate(self):
        return self.samp_rate

    def set_samp_rate(self, samp_rate):
        self.samp_rate = samp_rate
        self.rtlsdr_source_0.set_sample_rate(self.samp_rate)
        self.wxgui_waterfallsink2_0.set_sample_rate(self.samp_rate)
        self.wxgui_fftsink2_1.set_sample_rate(self.samp_rate)

if __name__ == '__main__':
    import ctypes
    import sys
    if sys.platform.startswith('linux'):
        try:
            x11 = ctypes.cdll.LoadLibrary('libX11.so')
            x11.XInitThreads()
        except:
            print "Warning: failed to XInitThreads()"
    parser = OptionParser(option_class=eng_option, usage="%prog: [options]")
    (options, args) = parser.parse_args()
    tb = fft_over_tcp()
    tb.Start(False)
    tb.Wait()
